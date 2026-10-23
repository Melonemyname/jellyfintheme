using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Jellyfin.Plugin.Bilder.Search;

/// <summary>
/// Albumcover über die iTunes Search API (ohne Schlüssel).
/// </summary>
internal sealed partial class AppleSearch
{
    /// <summary>Kantenlänge, auf die das Vorschaubild umgeschrieben wird.</summary>
    public const int Size = 3000;

    private readonly ApiClient _api;

    /// <summary>
    /// Initializes a new instance of the <see cref="AppleSearch"/> class.
    /// </summary>
    /// <param name="api">API-Zugang.</param>
    public AppleSearch(ApiClient api)
    {
        _api = api;
    }

    /// <summary>
    /// Sucht Albumcover. Titel und Interpret müssen passen.
    /// </summary>
    /// <param name="artist">Albuminterpret (darf leer sein).</param>
    /// <param name="album">Albumtitel.</param>
    /// <param name="country">Store-Land, zwei Buchstaben.</param>
    /// <param name="max">Höchstzahl Ergebnisse.</param>
    /// <param name="cancellationToken">Abbruch.</param>
    /// <returns>Bilder, bestes zuerst.</returns>
    public async Task<IReadOnlyList<ImageCandidate>> FindAlbumImagesAsync(string? artist, string album, string country, int max, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(album))
        {
            return [];
        }

        country = string.IsNullOrWhiteSpace(country) || country.Trim().Length != 2 ? "de" : country.Trim().ToLowerInvariant();

        // Fehlt das Album im eingestellten Store (z. B. ältere Platten in DE), einmal im US-Store nachsehen.
        foreach (var store in new[] { country, "us" }.Distinct(StringComparer.Ordinal))
        {
            var found = await SearchStoreAsync(artist, album, store, max, cancellationToken).ConfigureAwait(false);
            if (found.Count > 0)
            {
                return found;
            }
        }

        return [];
    }

    private async Task<IReadOnlyList<ImageCandidate>> SearchStoreAsync(string? artist, string album, string country, int max, CancellationToken cancellationToken)
    {
        var hasArtist = !string.IsNullOrWhiteSpace(artist);
        var term = hasArtist ? $"{artist!.Trim()} {NameMatcher.StripExtras(album)}" : album.Trim();
        var url = new Uri("https://itunes.apple.com/search?entity=album&limit=25&country=" + country
            + "&term=" + Uri.EscapeDataString(term));

        using var doc = await _api.GetJsonAsync(url, cancellationToken).ConfigureAwait(false);
        if (doc is null
            || doc.RootElement.ValueKind != JsonValueKind.Object
            || !doc.RootElement.TryGetProperty("results", out var results)
            || results.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var found = new List<(ImageCandidate Image, int Order)>();
        var order = 0;
        foreach (var item in results.EnumerateArray())
        {
            order++;
            if (item.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var title = Str(item, "collectionName");
            var albumScore = NameMatcher.Score(album, title);
            if (albumScore == NameMatcher.None)
            {
                continue;
            }

            var artistName = Str(item, "artistName");
            var artistScore = hasArtist ? NameMatcher.Score(artist, artistName) : NameMatcher.Similar;
            if (artistScore == NameMatcher.None)
            {
                continue;
            }

            var art = Str(item, "artworkUrl100") ?? Str(item, "artworkUrl60");
            var big = Enlarge(art);
            if (big is null)
            {
                continue;
            }

            found.Add((new ImageCandidate(big, Size, Size, $"{artistName} - {title}", (albumScore * 10) + artistScore), order));
        }

        return found
            .OrderByDescending(f => f.Image.Score)
            .ThenBy(f => f.Order)
            .Select(f => f.Image)
            .DistinctBy(i => i.Url, StringComparer.Ordinal)
            .Take(max)
            .ToList();
    }

    /// <summary>
    /// Schreibt ".../100x100bb.jpg" auf die große Fassung um.
    /// </summary>
    /// <param name="url">Vorschauadresse.</param>
    /// <returns>Große Fassung oder <c>null</c>.</returns>
    internal static string? Enlarge(string? url)
    {
        if (string.IsNullOrEmpty(url) || !url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var replaced = SizePart().Replace(url, $"/{Size}x{Size}bb.jpg");
        return replaced == url ? null : replaced;
    }

    private static string? Str(JsonElement e, string name)
        => e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    [GeneratedRegex(@"/\d+x\d+[a-z]*\.(jpg|png|webp)$", RegexOptions.IgnoreCase)]
    private static partial Regex SizePart();
}
