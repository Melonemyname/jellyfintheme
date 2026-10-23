using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin.Plugin.Bilder.Search;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Audio;
using MediaBrowser.Controller.Providers;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Providers;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.Bilder.Providers;

/// <summary>
/// Interpretenfotos von Deezer.
/// </summary>
public class DeezerArtistImageProvider : IRemoteImageProvider, IHasOrder
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<DeezerArtistImageProvider> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="DeezerArtistImageProvider"/> class.
    /// </summary>
    /// <param name="httpClientFactory">HTTP client factory.</param>
    /// <param name="logger">Logger.</param>
    public DeezerArtistImageProvider(IHttpClientFactory httpClientFactory, ILogger<DeezerArtistImageProvider> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "Deezer";

    /// <inheritdoc />
    public int Order => 10;

    /// <inheritdoc />
    public bool Supports(BaseItem item) => item is MusicArtist;

    /// <inheritdoc />
    public IEnumerable<ImageType> GetSupportedImages(BaseItem item) => [ImageType.Primary];

    /// <inheritdoc />
    public async Task<IEnumerable<RemoteImageInfo>> GetImages(BaseItem item, CancellationToken cancellationToken)
    {
        try
        {
            var search = new DeezerSearch(ProviderHelper.CreateApi(_httpClientFactory, _logger));
            var images = await search.FindArtistImagesAsync(item.Name, ProviderHelper.MaxResults, cancellationToken).ConfigureAwait(false);
            return ProviderHelper.ToRemote(images, Name);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Deezer-Interpretensuche für {Name} fehlgeschlagen", item.Name);
            return [];
        }
    }

    /// <inheritdoc />
    public Task<HttpResponseMessage> GetImageResponse(string url, CancellationToken cancellationToken)
        => ProviderHelper.GetImageResponseAsync(_httpClientFactory, url, cancellationToken);
}
