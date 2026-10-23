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
/// Albumcover aus dem Apple-Katalog (iTunes Search API).
/// </summary>
public class AppleAlbumImageProvider : IRemoteImageProvider, IHasOrder
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AppleAlbumImageProvider> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="AppleAlbumImageProvider"/> class.
    /// </summary>
    /// <param name="httpClientFactory">HTTP client factory.</param>
    /// <param name="logger">Logger.</param>
    public AppleAlbumImageProvider(IHttpClientFactory httpClientFactory, ILogger<AppleAlbumImageProvider> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "Apple Music";

    /// <inheritdoc />
    public int Order => 11;

    /// <inheritdoc />
    public bool Supports(BaseItem item) => item is MusicAlbum;

    /// <inheritdoc />
    public IEnumerable<ImageType> GetSupportedImages(BaseItem item) => [ImageType.Primary];

    /// <inheritdoc />
    public async Task<IEnumerable<RemoteImageInfo>> GetImages(BaseItem item, CancellationToken cancellationToken)
    {
        try
        {
            if (item is not MusicAlbum album)
            {
                return [];
            }

            var search = new AppleSearch(ProviderHelper.CreateApi(_httpClientFactory, _logger));
            var images = await search.FindAlbumImagesAsync(ProviderHelper.AlbumArtist(album), album.Name, ProviderHelper.AppleCountry, ProviderHelper.MaxResults, cancellationToken).ConfigureAwait(false);
            return ProviderHelper.ToRemote(images, Name);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Apple-Albumsuche für {Name} fehlgeschlagen", item.Name);
            return [];
        }
    }

    /// <inheritdoc />
    public Task<HttpResponseMessage> GetImageResponse(string url, CancellationToken cancellationToken)
        => ProviderHelper.GetImageResponseAsync(_httpClientFactory, url, cancellationToken);
}
