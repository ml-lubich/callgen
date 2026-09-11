"""Lint rules for a hand-authored inline-SVG diagram fragment."""

import json

import pytest

from callgen.cli import main
from callgen.diagrams import (
    MIN_FONT_PX,
    check_svg_fragment,
    extract_timestamps,
    figure_ids,
    html_errors,
    unresolved_timestamps,
)

from .conftest import FIXTURES

TURNS = [
    {"i": 0, "ts": "00:00:00", "s": 0, "spk": "A", "w": 8, "t": "walk me through it"},
    {"i": 1, "ts": "00:00:11", "s": 11, "spk": "B", "w": 9, "t": "the count breaks at the door"},
    {"i": 2, "ts": "00:00:48", "s": 48, "spk": "A", "w": 7, "t": "a timing artefact then"},
    {"i": 3, "ts": "00:01:02", "s": 62, "spk": "B", "w": 9, "t": "eighty per cent closed"},
    {"i": 4, "ts": "01:04:30", "s": 3870, "spk": "A", "w": 8, "t": "lead with that number"},
    {"i": 5, "ts": "01:07:15", "s": 4035, "spk": "B", "w": 9, "t": "a handheld at the apron"},
]


@pytest.fixture
def good():
    return (FIXTURES / "diagrams.html").read_text()


def kinds(problems):
    return sorted({p.kind for p in problems})


# ---------------------------------------------------------------- clean input


def test_the_shipped_fixture_is_clean(good):
    assert check_svg_fragment(good) == []


def test_figure_ids_are_returned_in_document_order(good):
    assert figure_ids(good) == ["dg-apron-dwell", "dg-gap-closes"]


def test_a_problem_reads_as_one_line(good):
    problem = check_svg_fragment(good.replace("var(--pen-a)", "#A6371F"))[0]
    text = str(problem)
    assert problem.kind in text and problem.where in text and problem.detail in text


# ---------------------------------------------------------------- each defect


def test_unbalanced_markup_is_reported(good):
    problems = check_svg_fragment(good.replace("</figure>", "", 1))
    assert kinds(problems) == ["not-well-formed"]


def test_a_literal_hex_colour_is_reported(good):
    problems = check_svg_fragment(good.replace("var(--pen-a)", "#A6371F"))
    assert kinds(problems) == ["hex-color"]
    assert "#A6371F" in problems[0].detail
    assert problems[0].where == "fragment"


def test_a_hex_colour_inside_a_figure_is_attributed_to_it(good):
    problems = check_svg_fragment(good.replace('class="box sb"', 'style="fill:#fff"', 1))
    assert [(p.kind, p.where) for p in problems] == [("hex-color", "dg-apron-dwell")]


def test_a_url_fragment_reference_is_not_a_colour(good):
    assert "url(#mk-" in good
    assert check_svg_fragment(good) == []


def test_monospace_is_reported(good):
    problems = check_svg_fragment(good.replace("var(--cond)", "monospace"))
    assert kinds(problems) == ["monospace"]


def test_literal_white_and_black_fills_are_reported(good):
    problems = check_svg_fragment(good.replace('class="box sb"', 'fill="white"', 1))
    assert kinds(problems) == ["named-color"]
    problems = check_svg_fragment(good.replace('class="box sb"', "fill='black'", 1))
    assert kinds(problems) == ["named-color"]


def test_a_marker_id_reused_across_figures_is_reported(good):
    problems = check_svg_fragment(good.replace("mk-gap-closes-a", "mk-apron-dwell-a"))
    assert kinds(problems) == ["duplicate-marker-id"]
    assert "mk-apron-dwell-a" in problems[0].detail


def test_a_figure_without_role_img_is_reported(good):
    problems = check_svg_fragment(good.replace('role="img"', "", 1))
    assert [(p.kind, p.where) for p in problems] == [("missing-a11y", "dg-apron-dwell")]
    assert 'role="img"' in problems[0].detail


def test_a_figure_without_a_title_or_desc_is_reported(good):
    problems = check_svg_fragment(good.replace("<title>", "<span>").replace("</title>", "</span>"))
    assert kinds(problems) == ["missing-a11y"]
    assert len(problems) == 2  # both figures lost their title

    problems = check_svg_fragment(good.replace("<desc>", "<span>").replace("</desc>", "</span>"))
    assert kinds(problems) == ["missing-a11y"]


def test_a_figure_without_a_numbered_key_is_reported(good):
    bad = good.replace('<ol class="dg-key">', "<ul>", 1).replace("</ol>", "</ul>", 1)
    problems = check_svg_fragment(bad)
    assert [(p.kind, p.where) for p in problems] == [("no-key", "dg-apron-dwell")]


def test_an_empty_key_is_reported(good):
    start = good.index('<ol class="dg-key">')
    end = good.index("</ol>", start) + len("</ol>")
    problems = check_svg_fragment(good[:start] + '<ol class="dg-key"></ol>' + good[end:])
    assert [(p.kind, p.where) for p in problems] == [("no-key", "dg-apron-dwell")]


def test_text_below_the_minimum_font_size_is_reported(good):
    small = f"{MIN_FONT_PX - 1}px"
    problems = check_svg_fragment(good.replace("11.5px", small, 1))
    assert kinds(problems) == ["tiny-text"]
    assert small in problems[0].detail


def test_a_font_size_attribute_is_checked_too(good):
    problems = check_svg_fragment(good.replace('class="n-l"', 'font-size="6"', 1))
    assert kinds(problems) == ["tiny-text"]


def test_a_font_size_at_the_minimum_passes(good):
    assert check_svg_fragment(good.replace("11.5px", f"{MIN_FONT_PX}px")) == []


def test_a_pinned_min_width_is_reported(good):
    bad = good.replace("height:auto", "height:auto;min-width:660px", 1)
    assert [(p.kind, p.where) for p in check_svg_fragment(bad)] == [("min-width", "dg-apron-dwell")]


def test_a_media_query_min_width_is_not_a_pinned_figure(good):
    ok = good.replace(".dg svg{display:block}", "@media (min-width:900px){.dg svg{margin:0}}", 1)
    assert check_svg_fragment(ok) == []


def test_a_scrolling_wrapper_is_reported(good):
    bad = good.replace(".dg svg{display:block}", ".dg .dg-scroll{overflow-x:auto}", 1)
    problems = check_svg_fragment(bad)
    assert [(p.kind, p.where) for p in problems] == [("scroll-wrapper", "fragment")] * 2


def test_a_figure_that_is_only_boxes_and_text_is_reported(good):
    start = good.index("<figure", good.index("dg-gap-closes") - 40)
    boxed = (
        '<figure class="dg" id="dg-boxed"><figcaption><span class="dg-t">A</span>'
        '<span class="dg-w">B</span></figcaption>'
        '<svg viewBox="0 0 1200 90" role="img"><title>Boxes</title><desc>Two boxes.</desc>'
        '<rect x="0" y="0" width="200" height="60"/><text x="8" y="30">one</text></svg>'
        '<ol class="dg-key"><li><b>said</b> <span>00:00:11</span></li></ol></figure>'
    )
    problems = check_svg_fragment(good[:start] + boxed + good[start:])
    assert [(p.kind, p.where) for p in problems] == [("no-glyph", "dg-boxed")]


def test_an_empty_desc_counts_as_no_desc(good):
    bad = good.replace(
        "<desc>A pallet arrives", "<desc>   </desc><desc data-old>A pallet arrives", 1
    )
    problems = check_svg_fragment(bad)
    assert [(p.kind, p.where) for p in problems] == [("missing-a11y", "dg-apron-dwell")]
    assert "<desc>" in problems[0].detail


def test_a_second_svg_in_a_figure_is_checked_on_its_own(good):
    bare = '<svg viewBox="0 0 1200 40" role="img"><title>t</title><desc>d</desc><line/></svg>'
    bad = good.replace("</svg>", "</svg>" + bare.replace("<desc>d</desc>", ""), 1)
    problems = check_svg_fragment(bad)
    assert [(p.kind, p.where) for p in problems] == [("missing-a11y", "dg-apron-dwell")]
    assert "<svg> 2" in problems[0].detail


def test_the_font_floor_is_eleven_pixels(good):
    assert MIN_FONT_PX == 11.0
    assert kinds(check_svg_fragment(good.replace("11.5px", "10.5px", 1))) == ["tiny-text"]


def test_several_defects_are_all_reported(good):
    bad = good.replace("var(--pen-a)", "#A6371F").replace("var(--cond)", "monospace")
    assert kinds(check_svg_fragment(bad)) == ["hex-color", "monospace"]


# ---------------------------------------------------------------- timestamps


def test_extract_timestamps_finds_each_one_once_in_order(good):
    assert extract_timestamps(good) == [
        "00:00:11",
        "00:00:48",
        "00:01:02",
        "01:04:30",
        "01:07:15",
    ]


def test_extract_timestamps_ignores_numbers_that_are_not_times():
    assert extract_timestamps('<svg viewBox="0 0 360 120"><text>12 pallets</text></svg>') == []


def test_every_fixture_timestamp_resolves_to_a_turn(good):
    assert unresolved_timestamps(good, TURNS) == []


def test_an_invented_timestamp_is_unresolved(good):
    assert unresolved_timestamps(good.replace("01:04:30", "00:22:09"), TURNS) == ["00:22:09"]


def test_a_short_timestamp_resolves_against_the_same_second():
    assert unresolved_timestamps("<p>1:02</p>", TURNS) == []


def test_html_errors_is_shared_with_the_page_check():
    assert html_errors("<figure><svg></svg></figure>") == []
    assert html_errors("<figure><svg></figure>")[0] == "</figure> closes <svg>"


# ---------------------------------------------------------------- the command


def _write(tmp_path, text):
    p = tmp_path / "diagrams.html"
    p.write_text(text)
    return str(p)


def test_cli_passes_a_clean_fragment(tmp_path, capsys, good):
    assert main(["lint-diagrams", _write(tmp_path, good)]) == 0
    out = capsys.readouterr().out
    assert "2 figures" in out
    assert "dg-apron-dwell" in out


def test_cli_fails_and_names_every_defect(tmp_path, capsys, good):
    bad = good.replace("var(--pen-a)", "#A6371F").replace("var(--cond)", "monospace")
    assert main(["lint-diagrams", _write(tmp_path, bad)]) == 1
    err = capsys.readouterr().err
    assert "hex-color" in err and "monospace" in err


@pytest.mark.parametrize(
    ("mutate", "kind"),
    [
        (lambda t: t.replace("</figure>", "", 1), "not-well-formed"),
        (lambda t: t.replace("var(--pen-a)", "#A6371F"), "hex-color"),
        (lambda t: t.replace("var(--cond)", "monospace"), "monospace"),
        (lambda t: t.replace('class="box sb"', 'fill="white"', 1), "named-color"),
        (lambda t: t.replace("mk-gap-closes-a", "mk-apron-dwell-a"), "duplicate-marker-id"),
        (lambda t: t.replace('role="img"', "", 1), "missing-a11y"),
        (
            lambda t: t.replace('<ol class="dg-key">', "<ul>", 1).replace("</ol>", "</ul>", 1),
            "no-key",
        ),
        (lambda t: t.replace("11.5px", "6px", 1), "tiny-text"),
        (lambda t: t.replace("height:auto", "height:auto;min-width:660px", 1), "min-width"),
        (
            lambda t: t.replace(".dg svg{display:block}", ".dg .x{overflow-x:scroll}", 1),
            "scroll-wrapper",
        ),
    ],
)
def test_cli_reports_each_seeded_defect(tmp_path, capsys, good, mutate, kind):
    assert main(["lint-diagrams", _write(tmp_path, mutate(good))]) == 1
    assert kind in capsys.readouterr().err


def test_cli_checks_timestamps_against_turns(tmp_path, capsys, good):
    turns = tmp_path / "turns.json"
    turns.write_text(json.dumps(TURNS))
    frag = _write(tmp_path, good.replace("01:04:30", "00:22:09"))
    assert main(["lint-diagrams", frag, "--turns", str(turns)]) == 1
    assert "00:22:09" in capsys.readouterr().err


def test_cli_accepts_resolved_timestamps(tmp_path, capsys, good):
    turns = tmp_path / "turns.json"
    turns.write_text(json.dumps(TURNS))
    assert main(["lint-diagrams", _write(tmp_path, good), "--turns", str(turns)]) == 0
    assert "5 timestamps" in capsys.readouterr().out


def test_cli_reports_a_missing_file(tmp_path, capsys):
    assert main(["lint-diagrams", str(tmp_path / "nope.html")]) == 1
    assert "callgen:" in capsys.readouterr().err
