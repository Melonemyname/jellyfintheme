using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin.Plugin.Bilder.Search;
using MediaBrowser.Common.Net;
using MediaBrowser.Controller.Entities.Audio;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Providers;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.Bilder.Providers;

/// <summary>
/// Gemeinsame Hilfen der Bildanbieter.
/// </summary>
internal static class ProviderHelper
{
    /// <summary>Gets the configured maximum per source.</summary>
    public static int MaxResults => Math.Clamp(Plugin.Instance?.Configuration.MaxResults ?? 10, 1, 25);

    /// <summary>Gets the configured iTunes country.</summary>
    public static string AppleCountry => Plugin.Instance?.Configuration.AppleCountry ?? "de";

    /// <summary>
    /// Baut den API-Zugang auf Jellyfins HttpClient.
    /// </summary>
    /// <param name="factory">Jellyfins IHttpClientFactory.</param>
    /// <param name="logger">Logger.</param>
    /// <returns>API-Zugang.</returns>
    public static ApiClient CreateApi(IHttpClientFactory factory, ILogger logger)
        => new(() => factory.CreateClient(NamedClient.Default), msg => logger.LogDebug("Bildsuche: {Message}", msg));

    /// <summary>
    /// Wandelt Treffer in Jellyfins Bildinfos um.
    /// </summary>
    /// <param name="images">Treffer.</param>
    /// <param name="providerName">Anzeigename der Quelle.</param>
    /// <returns>Bildinfos.</returns>
    public static IEnumerable<RemoteImageInfo> ToRemote(IEnumerable<ImageCandidate> images, string providerName)
        => images.Select(i => new RemoteImageInfo
        {
            ProviderName = providerName,
            Url = i.Url,
            Type = ImageType.Primary,
            Width = i.Width,
            Height = i.Height,
        }).ToList();

    /// <summary>
    /// Interpret eines Albums: zuerst Albuminterpret, sonst Interpret.
    /// </summary>
    /// <param name="album">Album.</param>
    /// <returns>Name oder <c>null</c>.</returns>
    public static string? AlbumArtist(MusicAlbum album)
        => album.AlbumArtists?.FirstOrDefault(a => !string.IsNullOrWhiteSpace(a))
           ?? album.Artists?.FirstOrDefault(a => !string.IsNullOrWhiteSpace(a));

    /// <summary>
    /// Lädt das gewählte Bild (wird von Jellyfin aufgerufen).
    /// </summary>
    /// <param name="factory">Jellyfins IHttpClientFactory.</param>
    /// <param name="url">Bildadresse.</param>
    /// <param name="cancellationToken">Abbruch.</param>
    /// <returns>Antwort.</returns>
    public static async Task<HttpResponseMessage> GetImageResponseAsync(IHttpClientFactory factory, string url, CancellationToken cancellationToken)
    {
        // Nicht freigeben: die Antwort verweist noch auf die Anfrage, Jellyfin gibt die Antwort frei.
        var request = new HttpRequestMessage(HttpMethod.Get, new Uri(url));
        request.Headers.UserAgent.Clear();
        request.Headers.UserAgent.ParseAdd(ApiClient.UserAgent);
        return await factory.CreateClient(NamedClient.Default)
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
            .ConfigureAwait(false);
    }
}
