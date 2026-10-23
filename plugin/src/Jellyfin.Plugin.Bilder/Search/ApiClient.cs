using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Jellyfin.Plugin.Bilder.Search;

/// <summary>
/// Höfliche JSON-Abfragen: eigener User-Agent, Zeitlimit, Mindestabstand je Host,
/// kurzer Zwischenspeicher. Fehler ergeben <c>null</c>, nie eine Ausnahme.
/// </summary>
internal sealed class ApiClient
{
    /// <summary>User-Agent für alle Anfragen des Plugins.</summary>
    public const string UserAgent = "JellyfinPluginDeezerAppleBilder/1.0 (+https://github.com/Melonemyname/jellyfintheme)";

    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan CacheTime = TimeSpan.FromMinutes(30);
    private const int CacheMax = 300;

    // Zwischen zwei Anfragen an denselben Host mindestens so lange warten.
    private static readonly Dictionary<string, TimeSpan> MinGap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["api.deezer.com"] = TimeSpan.FromMilliseconds(250),
        ["itunes.apple.com"] = TimeSpan.FromMilliseconds(1000),
    };

    private static readonly ConcurrentDictionary<string, SemaphoreSlim> Gates = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<string, DateTime> LastCall = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<string, (DateTime Time, string Body)> Cache = new(StringComparer.Ordinal);

    private readonly Func<HttpClient> _clientFactory;
    private readonly Action<string>? _log;

    /// <summary>
    /// Initializes a new instance of the <see cref="ApiClient"/> class.
    /// </summary>
    /// <param name="clientFactory">Liefert einen HttpClient (im Plugin aus Jellyfins IHttpClientFactory).</param>
    /// <param name="log">Optionale Ausgabe für Fehlermeldungen (Debug).</param>
    public ApiClient(Func<HttpClient> clientFactory, Action<string>? log = null)
    {
        _clientFactory = clientFactory;
        _log = log;
    }

    /// <summary>
    /// Holt ein JSON-Dokument. Gibt bei jedem Fehler <c>null</c> zurück.
    /// </summary>
    /// <param name="url">Adresse.</param>
    /// <param name="cancellationToken">Abbruch.</param>
    /// <returns>Das Dokument oder <c>null</c>.</returns>
    public async Task<JsonDocument?> GetJsonAsync(Uri url, CancellationToken cancellationToken)
    {
        try
        {
            var key = url.AbsoluteUri;
            if (Cache.TryGetValue(key, out var hit) && DateTime.UtcNow - hit.Time < CacheTime)
            {
                return JsonDocument.Parse(hit.Body);
            }

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(Timeout);

            var gate = Gates.GetOrAdd(url.Host, _ => new SemaphoreSlim(1, 1));
            await gate.WaitAsync(cts.Token).ConfigureAwait(false);
            string body;
            try
            {
                if (MinGap.TryGetValue(url.Host, out var gap)
                    && LastCall.TryGetValue(url.Host, out var last))
                {
                    var wait = last + gap - DateTime.UtcNow;
                    if (wait > TimeSpan.Zero)
                    {
                        await Task.Delay(wait, cts.Token).ConfigureAwait(false);
                    }
                }

                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.UserAgent.Clear();
                request.Headers.UserAgent.ParseAdd(UserAgent);
                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                try
                {
                    using var response = await _clientFactory()
                        .SendAsync(request, HttpCompletionOption.ResponseContentRead, cts.Token)
                        .ConfigureAwait(false);
                    if (!response.IsSuccessStatusCode)
                    {
                        _log?.Invoke($"{url.Host}: HTTP {(int)response.StatusCode}");
                        return null;
                    }

                    body = await response.Content.ReadAsStringAsync(cts.Token).ConfigureAwait(false);
                }
                finally
                {
                    LastCall[url.Host] = DateTime.UtcNow;
                }
            }
            finally
            {
                gate.Release();
            }

            var doc = JsonDocument.Parse(body);
            Remember(key, body);
            return doc;
        }
        catch (Exception ex)
        {
            _log?.Invoke($"{url.Host}: {ex.GetType().Name}: {ex.Message}");
            return null;
        }
    }

    private static void Remember(string key, string body)
    {
        if (Cache.Count >= CacheMax)
        {
            // Älteste Hälfte verwerfen, damit der Speicher klein bleibt.
            foreach (var old in Cache.OrderBy(e => e.Value.Time).Take(CacheMax / 2).Select(e => e.Key).ToList())
            {
                Cache.TryRemove(old, out _);
            }
        }

        Cache[key] = (DateTime.UtcNow, body);
    }
}
