using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Jellyfin.Plugin.Bilder.Search;

/// <summary>
/// Suche über die öffentliche Deezer-API (ohne Schlüssel).
/// </summary>
internal sealed class DeezerSearch
{
    private const string Base = "https://api.deezer.com/";
    private readonly ApiClient _api;

    /// <summary>
    /// Initializes a new instance of the <see cref="DeezerSearch"/> class.
    /// </summary>
    /// <param name="api">API-Zugang.</param>
    public DeezerSearch(ApiClient api)
    {
        _api = api;
    }

    /// <summary>
    /// Sucht Interpretenfotos. Exakte Namenstreffer zuerst, dann nach Fans.
    /// Einträge ohne Foto bei Deezer fallen weg.
    /// </summary>
    /// <param name="artist">Name des Interpreten.</param>
    /// <param name="max">Höchstzahl Ergebnisse.</param>
    /// <param name="cancellationToken">Abbruch.</param>
    /// <returns>Bilder, bestes zuerst.</returns>
    public async Task<IReadOnlyList<ImageCandidate>> FindArtistImagesAsync(string artist, int max, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(artist))
        {
            return [];
        }

        var url = new Uri(Base + "search/artist?limit=25&q=" + Uri.EscapeDataString(artist.Trim()));
        using var doc = await _api.GetJsonAsync(url, cancellationToken).ConfigureAwait(false);
        var found = new List<(ImageCandidate Image, long Fans)>();
        foreach (var item in Items(doc))
        {
            var name = Str(item, "name");
            var score = NameMatcher.Score(artist, name);

            // Nur ähnlich geschriebene Namen sind bei Personen zu oft jemand anderes ("Marc" statt "Marcus").
            if (score < NameMatcher.Contains)
            {
                continue;
            }

            var (pic, size) = Pick(item, ("picture_xl", 1000), ("picture_big", 500));
            if (pic is null || IsPlaceholder(pic))
            {
                continue;
            }

            found.Add((new ImageCandidate(pic, size, size, name ?? string.Empty, score), Long(item, "nb_fan")));
        }

        return found
            .OrderByDescending(f => f.Image.Score)
            .ThenByDescending(f => f.Fans)
            .Select(f => f.Image)
            .DistinctBy(i => i.Url, StringComparer.Ordinal)
            .Take(max)
            .ToList();
    }

    /// <summary>
    /// Sucht Albumcover. Titel und Interpret müssen passen.
    /// </summary>
    /// <param name="artist">Albuminterpret (darf leer sein).</param>
    /// <param name="album">Albumtitel.</param>
    /// <param name="max">Höchstzahl Ergebnisse.</param>
    /// <param name="cancellationToken">Abbruch.</param>
    /// <returns>Bilder, bestes zuerst.</returns>
    public async Task<IReadOnlyList<ImageCandidate>> FindAlbumImagesAsync(string? artist, string album, int max, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(album))
        {
            return [];
        }

        var hasArtist = !string.IsNullOrWhiteSpace(artist);

        // Erst die gezielte Suche, nur wenn sie nichts bringt die freie.
        var queries = new List<string>();
        if (hasArtist)
        {
            queries.Add($"artist:\"{Quote(artist!)}\" album:\"{Quote(album)}\"");
            queries.Add($"{artist!.Trim()} {NameMatcher.StripExtras(album)}");
        }
        else
        {
            queries.Add(album.Trim());
        }

        foreach (var q in queries)
        {
            var url = new Uri(Base + "search/album?limit=25&q=" + Uri.EscapeDataString(q));
            using var doc = await _api.GetJsonAsync(url, cancellationToken).ConfigureAwait(false);
            var found = new List<(ImageCandidate Image, int Order)>();
            var order = 0;
            foreach (var item in Items(doc))
            {
                order++;
                var title = Str(item, "title");
                var albumScore = NameMatcher.Score(album, title);
                if (albumScore == NameMatcher.None)
                {
                    continue;
                }

                var artistName = item.TryGetProperty("artist", out var a) && a.ValueKind == JsonValueKind.Object ? Str(a, "name") : null;
                var artistScore = hasArtist ? NameMatcher.Score(artist, artistName) : NameMatcher.Similar;
                if (artistScore == NameMatcher.None)
                {
                    continue;
                }

                var (pic, size) = Pick(item, ("cover_xl", 1000), ("cover_big", 500));
                if (pic is null || IsPlaceholder(pic))
                {
                    continue;
                }

                found.Add((new ImageCandidate(pic, size, size, $"{artistName} - {title}", (albumScore * 10) + artistScore), order));
            }

            if (found.Count > 0)
            {
                return found
                    .OrderByDescending(f => f.Image.Score)
                    .ThenBy(f => f.Order)
                    .Select(f => f.Image)
                    .DistinctBy(i => i.Url, StringComparer.Ordinal)
                    .Take(max)
                    .ToList();
            }
        }

        return [];
    }

    private static IEnumerable<JsonElement> Items(JsonDocument? doc)
    {
        if (doc is null
            || doc.RootElement.ValueKind != JsonValueKind.Object
            || !doc.RootElement.TryGetProperty("data", out var data)
            || data.ValueKind != JsonValueKind.Array)
        {
            // Auch {"error":{...}} (z. B. Kontingent überschritten) landet hier.
            return [];
        }

        return data.EnumerateArray().Where(e => e.ValueKind == JsonValueKind.Object);
    }

    private static (string? Url, int? Size) Pick(JsonElement item, params (string Field, int Size)[] fields)
    {
        foreach (var (field, size) in fields)
        {
            var v = Str(item, field);
            if (!string.IsNullOrEmpty(v) && v.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                return (v, size);
            }
        }

        return (null, null);
    }

    // Deezer liefert für Einträge ohne Bild einen leeren Pfad wie ".../images/artist//1000x1000-...".
    private static bool IsPlaceholder(string url)
        => url.Contains("/artist//", StringComparison.Ordinal)
           || url.Contains("/cover//", StringComparison.Ordinal);

    private static string Quote(string s) => s.Trim().Replace("\"", string.Empty, StringComparison.Ordinal);

    private static string? Str(JsonElement e, string name)
        => e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static long Long(JsonElement e, string name)
        => e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetInt64(out var l) ? l : 0;
}
