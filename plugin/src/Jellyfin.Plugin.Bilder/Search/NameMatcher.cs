using System;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Jellyfin.Plugin.Bilder.Search;

/// <summary>
/// Vergleicht Namen tolerant (Groß/klein, Akzente, Sonderzeichen, Zusätze in Klammern).
/// </summary>
internal static partial class NameMatcher
{
    /// <summary>Exakt gleich nach Normalisierung.</summary>
    public const int Exact = 4;

    /// <summary>Gleich nach Entfernen von Zusätzen wie "(Remastered)" oder Leerzeichen.</summary>
    public const int Stripped = 3;

    /// <summary>Einer enthält den anderen als ganze Wörter ("Halford" in "Rob Halford").</summary>
    public const int Contains = 2;

    /// <summary>Ähnlich geschrieben (Tippfehler, Kleinigkeiten).</summary>
    public const int Similar = 1;

    /// <summary>Kein Treffer.</summary>
    public const int None = 0;

    /// <summary>
    /// Bewertet, wie gut <paramref name="candidate"/> zu <paramref name="wanted"/> passt.
    /// </summary>
    /// <param name="wanted">Name aus der Bibliothek.</param>
    /// <param name="candidate">Name aus der Suche.</param>
    /// <returns>Eine der Konstanten <see cref="Exact"/> bis <see cref="None"/>.</returns>
    public static int Score(string? wanted, string? candidate)
    {
        var a = Normalize(wanted);
        var b = Normalize(candidate);
        if (a.Length == 0 || b.Length == 0)
        {
            return None;
        }

        if (a == b)
        {
            return Exact;
        }

        var sa = Normalize(StripExtras(wanted));
        var sb = Normalize(StripExtras(candidate));
        if (sa.Length > 0 && sa == sb)
        {
            return Stripped;
        }

        var ca = sa.Replace(" ", string.Empty, StringComparison.Ordinal);
        var cb = sb.Replace(" ", string.Empty, StringComparison.Ordinal);
        if (ca.Length > 0 && ca == cb)
        {
            return Stripped;
        }

        // Enthalten nur als ganzes Wort und bei nicht zu kurzen Namen, sonst passt "Kiss" zu allem.
        if (Math.Min(sa.Length, sb.Length) >= 4
            && ((" " + sb + " ").Contains(" " + sa + " ", StringComparison.Ordinal)
                || (" " + sa + " ").Contains(" " + sb + " ", StringComparison.Ordinal)))
        {
            return Contains;
        }

        var max = Math.Max(ca.Length, cb.Length);
        if (max >= 4 && 1.0 - ((double)Levenshtein(ca, cb) / max) >= 0.85)
        {
            return Similar;
        }

        return None;
    }

    /// <summary>
    /// Kleinbuchstaben, ohne Akzente und Satzzeichen, "&amp;" wird "and", führendes "the" entfällt.
    /// </summary>
    /// <param name="value">Eingabe.</param>
    /// <returns>Normalisierte Form.</returns>
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var s = value.ToLowerInvariant()
            .Replace("ø", "o", StringComparison.Ordinal)
            .Replace("æ", "ae", StringComparison.Ordinal)
            .Replace("œ", "oe", StringComparison.Ordinal)
            .Replace("ß", "ss", StringComparison.Ordinal)
            .Replace("ł", "l", StringComparison.Ordinal)
            .Replace("đ", "d", StringComparison.Ordinal)
            .Replace("&", " and ", StringComparison.Ordinal)
            .Replace("+", " and ", StringComparison.Ordinal);

        var sb = new StringBuilder(s.Length);
        foreach (var c in s.Normalize(NormalizationForm.FormD))
        {
            var cat = CharUnicodeInfo.GetUnicodeCategory(c);
            if (cat == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsLetterOrDigit(c))
            {
                sb.Append(c);
            }
            else if (c != '\'' && c != '’' && c != '.')
            {
                // Apostroph und Punkt fallen ersatzlos weg ("Guns N' Roses", "Mr. Big")
                sb.Append(' ');
            }
        }

        var result = Spaces().Replace(sb.ToString(), " ").Trim();
        if (result.StartsWith("the ", StringComparison.Ordinal))
        {
            result = result[4..];
        }

        return result;
    }

    /// <summary>
    /// Entfernt Zusätze in Klammern und nach " - " (z. B. "Remastered 2009", "Deluxe Edition").
    /// </summary>
    /// <param name="value">Eingabe.</param>
    /// <returns>Titel ohne Zusätze.</returns>
    public static string StripExtras(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        var s = Brackets().Replace(value, " ");
        var dash = s.IndexOf(" - ", StringComparison.Ordinal);
        if (dash > 0)
        {
            s = s[..dash];
        }

        return s.Trim();
    }

    private static int Levenshtein(string a, string b)
    {
        var prev = new int[b.Length + 1];
        var cur = new int[b.Length + 1];
        for (var j = 0; j <= b.Length; j++)
        {
            prev[j] = j;
        }

        for (var i = 1; i <= a.Length; i++)
        {
            cur[0] = i;
            for (var j = 1; j <= b.Length; j++)
            {
                var cost = a[i - 1] == b[j - 1] ? 0 : 1;
                cur[j] = Math.Min(Math.Min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }

            (prev, cur) = (cur, prev);
        }

        return prev[b.Length];
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();

    [GeneratedRegex(@"[\(\[\{][^\)\]\}]*[\)\]\}]")]
    private static partial Regex Brackets();
}
