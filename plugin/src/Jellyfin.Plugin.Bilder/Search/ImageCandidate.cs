namespace Jellyfin.Plugin.Bilder.Search;

/// <summary>
/// Ein gefundenes Bild samt Bewertung, wie gut der Treffer zum gesuchten Namen passt.
/// </summary>
/// <param name="Url">Bildadresse.</param>
/// <param name="Width">Breite in Pixeln, falls bekannt.</param>
/// <param name="Height">Höhe in Pixeln, falls bekannt.</param>
/// <param name="Title">Name des Treffers bei der Quelle (für Protokoll und Test).</param>
/// <param name="Score">Übereinstimmung, höher ist besser.</param>
internal sealed record ImageCandidate(string Url, int? Width, int? Height, string Title, int Score);
