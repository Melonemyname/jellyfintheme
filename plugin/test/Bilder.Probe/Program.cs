using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin.Plugin.Bilder.Providers;
using Jellyfin.Plugin.Bilder.Search;
using MediaBrowser.Controller.Entities.Audio;
using MediaBrowser.Model.Providers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

// Aufruf: dotnet run --project test/Bilder.Probe [-- "Interpret" ...]
// Ohne Argumente laufen die festen Beispielnamen aus der Bibliothek.
using var http = new HttpClient();
var api = new ApiClient(() => http, msg => Console.WriteLine("  ! " + msg));
var deezer = new DeezerSearch(api);
var apple = new AppleSearch(api);
var ct = CancellationToken.None;
var failures = 0;

// Abgleich-Selbsttest ohne Netz
(string A, string B, int Min)[] pairs =
[
    ("GHØSTKID", "Ghostkid", NameMatcher.Exact),
    ("Wheels Of Steel", "Wheels of Steel (2009 Remastered Version)", NameMatcher.Stripped),
    ("Sehnsucht", "Sehnsucht (Remastered 2023)", NameMatcher.Stripped),
    ("Halford", "Rob Halford", NameMatcher.Contains),
    ("Guns N' Roses", "Guns N Roses", NameMatcher.Exact),
    ("AC/DC", "ACDC", NameMatcher.Stripped),
    ("Within Temptation", "Within Temptaton", NameMatcher.Similar),
];
foreach (var (a, b, min) in pairs)
{
    var s = NameMatcher.Score(a, b);
    Console.WriteLine($"Abgleich {a} ~ {b}: {s}{(s >= min ? string.Empty : "  FEHLER")}");
    if (s < min) failures++;
}

foreach (var (a, b) in new[] { ("Kiss", "Kissin' Dynamite"), ("Marcus Bischoff", "Marc Bischoff") })
{
    var s = NameMatcher.Score(a, b);
    var ok = s < NameMatcher.Contains;
    Console.WriteLine($"Abgleich {a} ~ {b}: {s} (darf für Interpreten nicht reichen){(ok ? string.Empty : "  FEHLER")}");
    if (!ok) failures++;
}

var artists = args.Length > 0 ? args : new[]
{
    "Nightwish", "Within Temptation", "Johnny 3 Tears", "Frank Zummo", "Marcus Bischoff",
    "Mille Petrozza", "Halford", "GHØSTKID", "Beastboy",
};
foreach (var name in artists)
{
    var list = await deezer.FindArtistImagesAsync(name, 5, ct);
    Print($"Deezer Interpret \"{name}\"", list);
}

if (args.Length == 0)
{
    foreach (var (artist, album) in new[] { ("Saxon", "Wheels Of Steel"), ("Rammstein", "Sehnsucht"), ("Nightwish", "Imaginaerum") })
    {
        Print($"Deezer Album \"{artist} - {album}\"", await deezer.FindAlbumImagesAsync(artist, album, 5, ct));
        Print($"Apple Album \"{artist} - {album}\"", await apple.FindAlbumImagesAsync(artist, album, "de", 5, ct));
    }
}

if (args.Length == 0)
{
    // Die echten Anbieter so aufrufen, wie Jellyfin es tut (IHttpClientFactory, BaseItem).
    var services = new ServiceCollection();
    services.AddHttpClient(MediaBrowser.Common.Net.NamedClient.Default);
    using var sp = services.BuildServiceProvider();
    var factory = sp.GetRequiredService<IHttpClientFactory>();

    var artistProvider = new DeezerArtistImageProvider(factory, NullLogger<DeezerArtistImageProvider>.Instance);
    var artistItem = new MusicArtist { Name = "Within Temptation" };
    PrintRemote($"Anbieter {artistProvider.Name} für Interpret \"{artistItem.Name}\" (Supports={artistProvider.Supports(artistItem)})", await artistProvider.GetImages(artistItem, ct));

    var albumItem = new MusicAlbum { Name = "Sehnsucht", AlbumArtists = ["Rammstein"] };
    var deezerAlbum = new DeezerAlbumImageProvider(factory, NullLogger<DeezerAlbumImageProvider>.Instance);
    var appleAlbum = new AppleAlbumImageProvider(factory, NullLogger<AppleAlbumImageProvider>.Instance);
    PrintRemote($"Anbieter {deezerAlbum.Name} für Album \"Rammstein - Sehnsucht\"", await deezerAlbum.GetImages(albumItem, ct));
    PrintRemote($"Anbieter {appleAlbum.Name} für Album \"Rammstein - Sehnsucht\"", await appleAlbum.GetImages(albumItem, ct));

    // Bild so abholen, wie Jellyfin es nach der Auswahl tut
    var first = (await appleAlbum.GetImages(albumItem, ct)).FirstOrDefault();
    if (first?.Url is not null)
    {
        using var resp = await appleAlbum.GetImageResponse(first.Url, ct);
        Console.WriteLine($"GetImageResponse: HTTP {(int)resp.StatusCode} {resp.Content.Headers.ContentType} {resp.Content.Headers.ContentLength} Bytes");
        if (!resp.IsSuccessStatusCode) failures++;
    }

    // Unsinn darf nichts liefern und nicht abstürzen
    var none = await artistProvider.GetImages(new MusicArtist { Name = "xqzv kein Interpret 12345" }, ct);
    Console.WriteLine($"Unsinnsname: {none.Count()} Treffer");
}

Console.WriteLine(failures == 0 ? "OK" : $"{failures} Fehler");
return failures == 0 ? 0 : 1;

static void PrintRemote(string label, IEnumerable<RemoteImageInfo> list)
{
    var l = list.ToList();
    Console.WriteLine($"{label}: {l.Count} Bilder");
    foreach (var i in l)
    {
        Console.WriteLine($"  {i.ProviderName} {i.Type} {i.Width}x{i.Height} {i.Url}");
    }
}

static void Print(string label, IReadOnlyList<ImageCandidate> list)
{
    Console.WriteLine($"{label}: {list.Count} Treffer");
    foreach (var i in list)
    {
        Console.WriteLine($"  [{i.Score}] {i.Title} {i.Width}x{i.Height} {i.Url}");
    }
}
