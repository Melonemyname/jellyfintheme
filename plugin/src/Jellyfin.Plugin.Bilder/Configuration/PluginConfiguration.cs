using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.Bilder.Configuration;

/// <summary>
/// Einstellungen. Es gibt keine eigene Einstellungsseite; die Werte stehen in
/// plugins/configurations/Jellyfin.Plugin.Bilder.xml und gelten nach einem Neustart.
/// </summary>
public class PluginConfiguration : BasePluginConfiguration
{
    /// <summary>Gets or sets the iTunes store country (two letters).</summary>
    public string AppleCountry { get; set; } = "de";

    /// <summary>Gets or sets the maximum number of images offered per source.</summary>
    public int MaxResults { get; set; } = 10;
}
