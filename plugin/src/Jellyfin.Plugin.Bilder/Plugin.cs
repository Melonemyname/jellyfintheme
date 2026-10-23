using System;
using Jellyfin.Plugin.Bilder.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.Bilder;

/// <summary>
/// Plugin "Deezer &amp; Apple Bilder": zusätzliche Bildquellen für Interpreten und Alben.
/// </summary>
public class Plugin : BasePlugin<PluginConfiguration>
{
    /// <summary>Feste Kennung des Plugins (muss zur manifest.json passen).</summary>
    public const string PluginGuid = "3287719a-c59e-4b46-8f7a-8ba59429ee74";

    /// <summary>
    /// Initializes a new instance of the <see cref="Plugin"/> class.
    /// </summary>
    /// <param name="applicationPaths">Application paths.</param>
    /// <param name="xmlSerializer">XML serializer.</param>
    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
    }

    /// <summary>Gets the current plugin instance.</summary>
    public static Plugin? Instance { get; private set; }

    /// <inheritdoc />
    public override string Name => "Deezer & Apple Bilder";

    /// <inheritdoc />
    public override Guid Id => Guid.Parse(PluginGuid);

    /// <inheritdoc />
    public override string Description => "Interpretenfotos von Deezer sowie Albumcover von Deezer und Apple für die Bildsuche.";
}
