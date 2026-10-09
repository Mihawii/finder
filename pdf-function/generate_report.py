"""
PathwayFinder PDF Report Generator - Professional layout using ReportLab
Builds PDF from structured report JSON data - no html2canvas, no screenshots.
"""

import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, HRFlowable, PageBreak
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib import colors

# ============================================================
# COLORS
# ============================================================
DARK_GREEN = HexColor("#1B4332")
MID_GREEN = HexColor("#2D6A4F")
LIGHT_GREEN = HexColor("#52B788")
PALE_GREEN = HexColor("#E8F5ED")
CREAM = HexColor("#F8F7F2")
AMBER = HexColor("#E9C46A")
AMBER_BG = HexColor("#FEF7E0")
CORAL = HexColor("#E76F51")
CORAL_BG = HexColor("#FDE8E4")
BODY_TEXT = HexColor("#333333")
LIGHT_TEXT = HexColor("#666666")
BORDER = HexColor("#E0E0E0")
CARD_BG = HexColor("#FAFAF8")
WHITE = white
BAR_BG = HexColor("#E8E8E4")

# ============================================================
# STYLES
# ============================================================
def get_styles():
    return {
        'title': ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=26,
            textColor=DARK_GREEN, spaceAfter=6, leading=30),
        'subtitle': ParagraphStyle('Subtitle', fontName='Helvetica', fontSize=11,
            textColor=LIGHT_TEXT, spaceAfter=16, leading=15),
        'h2': ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=18,
            textColor=DARK_GREEN, spaceBefore=10, spaceAfter=6, leading=22),
        'h3': ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=13,
            textColor=DARK_GREEN, spaceBefore=6, spaceAfter=4, leading=16),
        'body': ParagraphStyle('Body', fontName='Helvetica', fontSize=10,
            textColor=BODY_TEXT, spaceAfter=4, leading=14),
        'body_bold': ParagraphStyle('BodyBold', fontName='Helvetica-Bold', fontSize=10,
            textColor=BODY_TEXT, spaceAfter=4, leading=14),
        'small': ParagraphStyle('Small', fontName='Helvetica', fontSize=8.5,
            textColor=LIGHT_TEXT, spaceAfter=2, leading=11),
        'label': ParagraphStyle('Label', fontName='Helvetica-Bold', fontSize=7.5,
            textColor=MID_GREEN, spaceAfter=2, leading=10),
        'big_number': ParagraphStyle('BigNum', fontName='Helvetica-Bold', fontSize=36,
            textColor=DARK_GREEN, leading=40),
        'medium_number': ParagraphStyle('MedNum', fontName='Helvetica-Bold', fontSize=22,
            textColor=DARK_GREEN, leading=26),
        'green_number': ParagraphStyle('GreenNum', fontName='Helvetica-Bold', fontSize=36,
            textColor=MID_GREEN, leading=40),
        'check_green': ParagraphStyle('CheckGreen', fontName='Helvetica', fontSize=9.5,
            textColor=HexColor("#236344"), leading=13, spaceAfter=3),
        'check_red': ParagraphStyle('CheckRed', fontName='Helvetica', fontSize=9.5,
            textColor=HexColor("#8B2500"), leading=13, spaceAfter=3),
        'gap_item': ParagraphStyle('GapItem', fontName='Helvetica', fontSize=9.5,
            textColor=HexColor("#7A5B1F"), leading=13, spaceAfter=3),
        'footer': ParagraphStyle('Footer', fontName='Helvetica', fontSize=7.5,
            textColor=LIGHT_TEXT, alignment=TA_CENTER),
        'disclaimer': ParagraphStyle('Disclaimer', fontName='Helvetica', fontSize=8.5,
            textColor=HexColor("#7A6520"), leading=12, spaceAfter=4),
    }


# ============================================================
# CUSTOM FLOWABLES
# ============================================================

class HorizontalBar(Flowable):
    """Draws a horizontal bar chart segment"""
    def __init__(self, value, max_val, width=300, height=14,
                 fill_color=MID_GREEN, bg_color=BAR_BG, label_right=""):
        Flowable.__init__(self)
        self.value = value
        self.max_val = max_val
        self.bar_width = width
        self.bar_height = height
        self.fill_color = fill_color
        self.bg_color = bg_color
        self.label_right = label_right
        self.width = width + 60
        self.height = height

    def draw(self):
        # Background bar
        self.canv.setFillColor(self.bg_color)
        self.canv.roundRect(0, 0, self.bar_width, self.bar_height, 3, fill=1, stroke=0)
        # Fill bar
        if self.max_val > 0:
            fill_w = max((self.value / self.max_val) * self.bar_width, 4)
            self.canv.setFillColor(self.fill_color)
            self.canv.roundRect(0, 0, fill_w, self.bar_height, 3, fill=1, stroke=0)
        # Right label
        if self.label_right:
            self.canv.setFont("Helvetica-Bold", 9)
            self.canv.setFillColor(BODY_TEXT)
            self.canv.drawString(self.bar_width + 8, 3, self.label_right)


def make_summary_card(label, value, width, value_color=DARK_GREEN, value_size=22):
    """Build a summary card as a Table — text NEVER overlaps because ReportLab
    handles layout automatically. No manual Y positioning."""
    label_style = ParagraphStyle('CardLabel', fontName='Helvetica-Bold', fontSize=6.5,
        textColor=MID_GREEN, leading=9, spaceBefore=0, spaceAfter=0)

    fs = value_size
    val = str(value)
    if len(val) > 50: fs = 8
    elif len(val) > 30: fs = 9
    elif len(val) > 20: fs = 10
    elif len(val) > 12: fs = 13

    value_style = ParagraphStyle('CardValue', fontName='Helvetica-Bold', fontSize=fs,
        textColor=value_color, leading=fs + 4, spaceBefore=0, spaceAfter=0)

    card_data = [
        [Paragraph(label.upper(), label_style)],
        [Paragraph(val, value_style)],
    ]

    card = Table(card_data, colWidths=[width - 14])
    card.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (0, 0), 7),
        ('TOPPADDING', (0, 1), (0, 1), 2),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 7),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    return card


class BadgeFlowable(Flowable):
    """A small colored badge/pill"""
    def __init__(self, text, bg_color=PALE_GREEN, text_color=DARK_GREEN, width=None):
        Flowable.__init__(self)
        self.text = text
        self.bg_color = bg_color
        self.text_color = text_color
        self.badge_width = width or (len(text) * 5.5 + 16)
        self.badge_height = 16
        self.width = self.badge_width
        self.height = self.badge_height

    def draw(self):
        self.canv.setFillColor(self.bg_color)
        self.canv.roundRect(0, 0, self.badge_width, self.badge_height, 8, fill=1, stroke=0)
        self.canv.setFont("Helvetica-Bold", 7.5)
        self.canv.setFillColor(self.text_color)
        self.canv.drawCentredString(self.badge_width / 2, 4.5, self.text)


class ProjectedScoreBanner(Flowable):
    """Dark green banner showing current → projected score.
    Uses top-down y_cursor layout so elements NEVER overlap."""
    def __init__(self, current, projected, text, badges, width=490):
        Flowable.__init__(self)
        self.current = str(current)
        self.projected = str(projected)
        self.text = text
        self.badges = badges[:6]
        self.banner_width = width
        x = 16
        max_x = width - 16
        rows = 1
        for badge_text in self.badges:
            bw = len(badge_text) * 5.2 + 16
            if x + bw > max_x and x > 16:
                x = 16
                rows += 1
            x += bw + 6
        self.badge_rows = rows
        self.banner_height = 12 + 12 + 4 + 36 + 8 + 12 + 8 + (rows * 20) + 10
        self.width = width
        self.height = self.banner_height

    def draw(self):
        self.canv.setFillColor(DARK_GREEN)
        self.canv.roundRect(0, 0, self.banner_width, self.banner_height, 10, fill=1, stroke=0)
        y = self.banner_height - 12
        y -= 10
        self.canv.setFont("Helvetica-Bold", 7)
        self.canv.setFillColor(HexColor("#AFDCC3"))
        self.canv.drawString(16, y, "PROJECTED SCORE")
        y -= 36
        self.canv.setFont("Helvetica-Bold", 30)
        self.canv.setFillColor(WHITE)
        self.canv.drawString(16, y, self.current)
        cur_w = self.canv.stringWidth(self.current, "Helvetica-Bold", 30)
        self.canv.setFont("Helvetica", 18)
        self.canv.setFillColor(HexColor("#AFDCC3"))
        self.canv.drawString(16 + cur_w + 8, y + 3, "→")
        self.canv.setFont("Helvetica-Bold", 30)
        self.canv.setFillColor(LIGHT_GREEN)
        self.canv.drawString(16 + cur_w + 30, y, self.projected)
        y -= 18
        self.canv.setFont("Helvetica", 8)
        self.canv.setFillColor(HexColor("#D0E8DA"))
        self.canv.drawString(16, y, self.text[:100])
        y -= 20
        x = 16
        max_x = self.banner_width - 16
        for badge_text in self.badges[:6]:
            bw = len(badge_text) * 5.2 + 16
            if x + bw > max_x and x > 16:
                x = 16
                y -= 20
            self.canv.setFillColor(HexColor("#1B5E3A"))
            self.canv.roundRect(x, y, bw, 15, 7, fill=1, stroke=0)
            self.canv.setFont("Helvetica", 6)
            self.canv.setFillColor(WHITE)
            self.canv.drawCentredString(x + bw/2, y + 4.5, badge_text)
            x += bw + 6


# ============================================================
# PAGE TEMPLATE WITH HEADER/FOOTER
# ============================================================

def add_page_furniture(canvas, doc):
    """Add header and footer to every page"""
    canvas.saveState()
    page_w, page_h = A4
    # Header on page 1
    if doc.page == 1:
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(LIGHT_TEXT)
        canvas.drawString(20*mm, page_h - 10*mm, "PathwayFinder — Immigration Pathway Report")
    # Footer on every page
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(LIGHT_TEXT)
    # Use the AI's dataDisclaimer (stashed on doc) when present; else the original hardcoded date.
    footer_date = getattr(doc, "_data_disclaimer", None) or "Data valid as of March 2026"
    # Footer is a single narrow line — keep only the short date portion, dropping the
    # "— verify current program details…" clause (it remains in the end-of-report disclaimer).
    footer_date = footer_date.split(" — verify")[0].strip()
    footer_text = f"Page {doc.page} — {footer_date} — Not immigration advice"
    canvas.drawCentredString(page_w / 2, 8*mm, footer_text)
    canvas.restoreState()


# ============================================================
# BUILD REPORT
# ============================================================

def build_report(data, output_path):
    styles = get_styles()
    page_w, page_h = A4
    content_w = page_w - 40*mm  # 20mm margins each side

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=15*mm, bottomMargin=15*mm,
    )

    # Expose the AI's dataDisclaimer to the page-footer callback (read in add_page_furniture).
    doc._data_disclaimer = data.get('dataDisclaimer')

    story = []

    # ---- PAGE 1: COVER / EXECUTIVE SUMMARY ----
    story.append(Paragraph("Your Pathway Report", styles['title']))
    story.append(Paragraph(
        "A personalized immigration report based on your profile, your current "
        "Comprehensive Ranking System (CRS) score, and a comparison across "
        "federal and provincial pathways.", styles['subtitle']))

    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=12))

    # Summary cards as a table
    crs_score = data.get('crs', {}).get('total', '—')
    best_pathway = data.get('pathways', [{}])[0].get('name', '—') if data.get('pathways') else '—'
    top_match = data.get('pathways', [{}])[0].get('chance', '—') if data.get('pathways') else '—'
    if isinstance(top_match, (int, float)):
        top_match = f"{top_match}%"
    key_insight = data.get('crs', {}).get('keyInsight', '')
    projected = data.get('scoreAnalysis', {}).get('projectedScore', '')

    summary_data = [[
        make_summary_card("CRS Score", crs_score, 105, value_size=22),
        make_summary_card("Best Pathway", best_pathway, 145, value_size=14),
        make_summary_card("Top Match", top_match, 90, value_color=MID_GREEN, value_size=22),
        make_summary_card("Key Insight", key_insight,
                   155, value_color=BODY_TEXT, value_size=9),
    ]]

    summary_table = Table(summary_data, colWidths=[110, 150, 95, 160])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 16))

    # Profile summary
    profile = data.get('profile', {})
    story.append(Paragraph("PROFILE SUMMARY", styles['label']))
    story.append(Paragraph(profile.get('summary', 'No summary available.'), styles['body']))
    story.append(Spacer(1, 6))

    # Competitiveness
    competitiveness = data.get('crs', {}).get('competitiveness', '')
    if competitiveness:
        story.append(Paragraph("AT A GLANCE", styles['label']))
        story.append(Paragraph(competitiveness, styles['body']))
        story.append(Spacer(1, 6))

    # (Key Insight is shown once on the summary card on page 1 — duplicate block removed.)

    # Strengths and Gaps side by side
    strengths = profile.get('strengths', [])
    gaps = profile.get('gaps', [])
    max_rows = max(len(strengths), len(gaps))

    if strengths or gaps:
        sg_data = [
            [Paragraph("<b>Strengths</b>", ParagraphStyle('', fontName='Helvetica-Bold',
                fontSize=11, textColor=HexColor("#236344"))),
             Paragraph("<b>Gaps</b>", ParagraphStyle('', fontName='Helvetica-Bold',
                fontSize=11, textColor=HexColor("#8B5B1F")))]
        ]
        for i in range(max_rows):
            s_text = f"✓  {strengths[i]}" if i < len(strengths) else ""
            g_text = f"⚠  {gaps[i]}" if i < len(gaps) else ""
            sg_data.append([
                Paragraph(s_text, styles['check_green']),
                Paragraph(g_text, styles['gap_item']),
            ])

        sg_table = Table(sg_data, colWidths=[content_w * 0.5, content_w * 0.5])
        sg_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), PALE_GREEN),
            ('BACKGROUND', (1, 0), (1, 0), AMBER_BG),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ROUNDEDCORNERS', [6, 6, 6, 6]),
            ('BOX', (0, 0), (0, -1), 0.5, BORDER),
            ('BOX', (1, 0), (1, -1), 0.5, BORDER),
        ]))
        story.append(KeepTogether([sg_table]))

    # ---- PAGE 2: CRS SCORE ANALYSIS ----
    story.append(PageBreak())
    story.append(Paragraph("CRS Score Analysis", styles['h2']))
    story.append(Paragraph(
        "Where your score comes from, how competitive it looks, and which "
        "draw categories are closer to your current profile.", styles['body']))
    story.append(Spacer(1, 8))

    # Score display — use a dedicated style with correct leading
    score_style = ParagraphStyle('ScoreDisplay', fontName='Helvetica-Bold', fontSize=32,
        textColor=DARK_GREEN, leading=36, spaceAfter=2)
    story.append(Paragraph(str(crs_score), score_style))
    story.append(Paragraph("out of 1,200", styles['small']))
    # (Competitiveness is shown once under "At a glance" on page 1 — duplicate block removed.)
    story.append(Spacer(1, 12))

    # Breakdown bars
    story.append(Paragraph("BREAKDOWN", styles['label']))
    breakdown_items = data.get('_breakdown', {})
    breakdown_config = [
        ("Age", breakdown_items.get('age', 0), 110),
        ("Education", breakdown_items.get('education', 0), 150),
        ("First Language", breakdown_items.get('firstLanguage', 0), 136),
        ("Second Language", breakdown_items.get('secondLanguage', 0), 24),
        ("Canadian Work", breakdown_items.get('canadianWork', 0), 80),
        ("Spouse", breakdown_items.get('spouse', 0), 40),
        ("Skill Transfer", breakdown_items.get('skillTransfer', 0), 100),
        ("Additional", breakdown_items.get('additional', 0), 600),
    ]

    for label, value, max_val in breakdown_config:
        row_data = [[
            Paragraph(label, styles['body']),
            HorizontalBar(value, max_val, width=280, height=12),
            Paragraph(f"<b>{value}</b>", ParagraphStyle('', fontName='Helvetica-Bold',
                fontSize=10, textColor=BODY_TEXT, alignment=TA_RIGHT)),
        ]]
        row_table = Table(row_data, colWidths=[100, 310, 50])
        row_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(row_table)

    story.append(Spacer(1, 14))

    # Draw comparison
    story.append(Paragraph("DRAW COMPARISON", styles['label']))
    cutoffs = [
        ("CEC", 507, 511), ("French", 393, 400), ("Healthcare", 467, 467),
        ("Senior Mgrs", 429, 429), ("PNP", 710, 789), ("Trade", 350, 400),
    ]
    score_num = int(crs_score) if str(crs_score).isdigit() else 0

    for name, cmin, cmax in cutoffs:
        above = score_num >= cmin
        bar_color = LIGHT_GREEN if above else HexColor("#E8A87C")
        row_data = [[
            Paragraph(name, styles['body']),
            HorizontalBar(score_num, 800, width=260, height=10,
                         fill_color=bar_color, label_right=""),
            Paragraph(f"{cmin}-{cmax}", ParagraphStyle('', fontName='Helvetica',
                fontSize=9, textColor=LIGHT_TEXT, alignment=TA_RIGHT)),
        ]]
        row_table = Table(row_data, colWidths=[90, 300, 70])
        row_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(row_table)

    # ---- PAGE 3: WHERE YOU'RE LOSING POINTS ----
    story.append(PageBreak())
    story.append(Paragraph("Where You're Losing Points", styles['h2']))
    story.append(Paragraph(
        "Areas where your current profile is below the maximum available score.",
        styles['body']))
    story.append(Spacer(1, 8))

    losses = data.get('scoreAnalysis', {}).get('losses', [])
    if losses:
        loss_header = [
            Paragraph("<b>Category</b>", styles['small']),
            Paragraph("<b>Current / Max</b>", styles['small']),
            Paragraph("<b>Lost</b>", styles['small']),
            Paragraph("<b>Status</b>", styles['small']),
            Paragraph("<b>Explanation</b>", styles['small']),
        ]
        loss_rows = [loss_header]
        for loss in losses:
            fixable = loss.get('fixable', True)
            status_text = "Improvable" if fixable else "Can't change"
            status_style = ParagraphStyle('', fontName='Helvetica-Bold', fontSize=8,
                textColor=MID_GREEN if fixable else CORAL)

            loss_rows.append([
                Paragraph(loss.get('category', ''), styles['body']),
                Paragraph(f"{loss.get('currentPoints', 0)} / {loss.get('maxPoints', 0)}", styles['body']),
                Paragraph(f"<b>{loss.get('pointsLost', 0)}</b>", styles['body_bold']),
                Paragraph(status_text, status_style),
                Paragraph(loss.get('explanation', ''), styles['small']),
            ])

        loss_table = Table(loss_rows, colWidths=[80, 65, 40, 70, 225])
        loss_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), CREAM),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, BORDER),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ]))
        story.append(loss_table)

    # ---- OPPORTUNITIES ----
    story.append(Spacer(1, 16))
    story.append(Paragraph("How to Gain Points", styles['h2']))
    story.append(Paragraph(
        "The highest-value improvements based on your current profile.", styles['body']))
    story.append(Spacer(1, 8))

    opportunities = data.get('scoreAnalysis', {}).get('opportunities', [])
    for opp in opportunities:
        pts = opp.get('pointsGain', 0)
        difficulty = opp.get('difficulty', 'medium')
        diff_color = PALE_GREEN if difficulty == 'easy' else (AMBER_BG if difficulty == 'medium' else CORAL_BG)
        diff_text_color = MID_GREEN if difficulty == 'easy' else (HexColor("#7A5B1F") if difficulty == 'medium' else CORAL)

        opp_content = []
        opp_content.append(Paragraph(
            f"<font size=16 color='#2D6A4F'><b>+{pts}</b></font>"
            f"  <font size=10 color='#333333'><b>{opp.get('action', '')}</b></font>",
            styles['body']))
        opp_content.append(Spacer(1, 3))
        detail_parts = []
        if difficulty:
            detail_parts.append(f"<font color='#666666'>{difficulty}</font>")
        if opp.get('timeframe'):
            detail_parts.append(f"<font color='#666666'>{opp['timeframe']}</font>")
        if opp.get('cost'):
            detail_parts.append(f"Estimated cost: <b>{opp['cost']}</b>")
        if detail_parts:
            opp_content.append(Paragraph("  |  ".join(detail_parts), styles['small']))

        opp_block = KeepTogether(opp_content + [Spacer(1, 4),
            HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6)])
        story.append(opp_block)

    # Projected score banner
    proj_text = data.get('scoreAnalysis', {}).get('projectedScore', '')
    proj_current = str(crs_score)
    proj_target = ''

    if isinstance(proj_text, str) and '→' in proj_text:
        parts = proj_text.split('→')
        # Get current from left side - last number
        left_nums = [s for s in parts[0].strip().split() if s.isdigit()]
        if left_nums:
            proj_current = left_nums[-1]
        # Get target from right side - first number only (before any dash or comma)
        right = parts[1].strip()
        target_num = ''
        for ch in right:
            if ch.isdigit():
                target_num += ch
            elif target_num:
                break  # stop at first non-digit after we started collecting
        proj_target = target_num if target_num else ''

    if not proj_target:
        # Fallback: add 30 to current score
        try:
            proj_target = str(int(proj_current) + 30)
        except:
            proj_target = '—'

    # Determine which cutoffs the projected score crosses
    proj_num = int(proj_target) if proj_target.isdigit() else 0
    crossed = [name for name, cmin, cmax in cutoffs if proj_num >= cmin]

    banner = ProjectedScoreBanner(
        proj_current, proj_target,
        f"Your score could reach {proj_target} with the improvements above.",
        [f"Crosses {c} range" for c in crossed],
        width=int(content_w)
    )
    story.append(Spacer(1, 10))
    story.append(banner)

    # ---- PATHWAYS ----
    story.append(PageBreak())
    story.append(Paragraph("Recommended Pathways", styles['h2']))
    story.append(Paragraph(
        "The strongest pathways for your profile, ranked by fit, timing, and practicality.",
        styles['body']))
    story.append(Spacer(1, 10))

    pathways = sorted(data.get('pathways', []), key=lambda p: p.get('rank', 99))

    for pw in pathways[:5]:
        pw_content = []

        # Header: #rank  Name  Match%
        rank = pw.get('rank', '?')
        name = pw.get('name', 'Unknown')
        chance = pw.get('chance', '—')
        if isinstance(chance, (int, float)):
            chance = f"{chance}%"
        stream = pw.get('stream', '')
        status = pw.get('status', 'active')
        timeline = pw.get('timeline', '')
        cost = pw.get('cost', '')

        header_data = [[
            Paragraph(f"<font size=10 color='#FFFFFF'><b>#{rank}</b></font>",
                ParagraphStyle('', alignment=TA_CENTER, fontSize=10)),
            Paragraph(f"<b>{name}</b><br/><font size=8 color='#666666'>{stream}</font>",
                styles['body_bold']),
            Paragraph(f"<font size=22 color='#2D6A4F'><b>{chance}</b></font>",
                ParagraphStyle('', alignment=TA_RIGHT, fontSize=22)),
        ]]
        header_table = Table(header_data, colWidths=[35, content_w - 120, 85])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (0, 0), MID_GREEN),
            ('ROUNDEDCORNERS', [12, 0, 0, 12]),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        pw_content.append(header_table)

        # Status badges line
        badge_parts = []
        if status:
            badge_parts.append(f"<font color='#2D6A4F'><b>{status}</b></font>")
        if timeline:
            badge_parts.append(timeline)
        if cost:
            badge_parts.append(cost)
        if badge_parts:
            pw_content.append(Paragraph("  |  ".join(badge_parts), styles['small']))

        # Why this fits
        why = pw.get('why', '')
        if why:
            pw_content.append(Spacer(1, 4))
            pw_content.append(Paragraph(f"<b>Why this fits you:</b> {why}", styles['body']))

        # Requirements
        reqs = pw.get('requirements', [])
        if reqs:
            pw_content.append(Spacer(1, 4))
            for req in reqs:
                met = req.get('met', False)
                icon = "✓" if met else "✗"
                color = "#236344" if met else "#C0392B"
                pw_content.append(Paragraph(
                    f"<font color='{color}'><b>{icon}</b></font>  {req.get('item', '')}",
                    styles['body']))

        # Details (if present)
        details = pw.get('details', {})
        if details.get('description'):
            pw_content.append(Spacer(1, 4))
            pw_content.append(Paragraph("DESCRIPTION", styles['label']))
            pw_content.append(Paragraph(details['description'], styles['small']))

        if details.get('applicationProcess'):
            pw_content.append(Spacer(1, 4))
            pw_content.append(Paragraph("APPLICATION PROCESS", styles['label']))
            for i, step in enumerate(details['applicationProcess'], 1):
                pw_content.append(Paragraph(f"<b>{i}.</b> {step}", styles['small']))

        info_parts = []
        if details.get('processingTime'):
            info_parts.append(f"<b>Processing:</b> {details['processingTime']}")
        if details.get('alternatives'):
            info_parts.append(f"<b>Alternatives:</b> {details['alternatives']}")
        if info_parts:
            pw_content.append(Spacer(1, 3))
            pw_content.append(Paragraph("  |  ".join(info_parts), styles['small']))

        if details.get('improvementTips'):
            pw_content.append(Spacer(1, 3))
            pw_content.append(Paragraph(f"<b>Tip:</b> {details['improvementTips']}", styles['small']))

        # Wrap pathway in KeepTogether
        pw_content.append(Spacer(1, 6))
        pw_content.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=10))
        story.append(KeepTogether(pw_content))

    # ---- ACTION PLAN ----
    story.append(PageBreak())
    story.append(Paragraph("Action Plan", styles['h2']))
    story.append(Paragraph("Start with the highest-priority moves first.", styles['body']))
    story.append(Spacer(1, 8))

    action_plan = data.get('actionPlan', [])
    # Sort by priority
    priority_order = {'urgent': 0, 'high': 1, 'medium': 2}
    action_plan_sorted = sorted(action_plan, key=lambda a: priority_order.get(a.get('priority', 'medium'), 2))

    for action in action_plan_sorted:
        priority = action.get('priority', 'medium')
        if priority == 'urgent':
            p_color = CORAL
            p_bg = CORAL_BG
        elif priority == 'high':
            p_color = HexColor("#7A5B1F")
            p_bg = AMBER_BG
        else:
            p_color = LIGHT_TEXT
            p_bg = HexColor("#F0F0F0")

        step_num = action.get('step', '')
        action_content = []
        action_content.append(Paragraph(
            f"<font color='#2D6A4F'><b>Step {step_num}</b></font>"
            f"  <font size=8 color='{p_color.hexval()}'><b>[{priority.upper()}]</b></font>",
            styles['body']))
        action_content.append(Paragraph(f"<b>{action.get('action', '')}</b>", styles['body_bold']))

        detail_line = []
        if action.get('where'):
            detail_line.append(f"Where: <u>{action['where']}</u>")
        if action.get('cost'):
            detail_line.append(f"Cost: <b>{action['cost']}</b>")
        if action.get('time'):
            detail_line.append(f"Time: <b>{action['time']}</b>")
        if detail_line:
            action_content.append(Paragraph("  |  ".join(detail_line), styles['small']))

        action_content.append(Spacer(1, 3))
        action_content.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))
        story.append(KeepTogether(action_content))

    # ---- COSTS ----
    story.append(Spacer(1, 10))
    story.append(Paragraph("Estimated Costs", styles['h2']))
    story.append(Paragraph("A rough view of the main costs you may need to plan for.", styles['body']))
    story.append(Spacer(1, 6))

    total_cost = data.get('costs', {}).get('total', '—')
    story.append(Paragraph(f"<font size=20><b>{total_cost} CAD</b></font>" if 'CAD' not in str(total_cost)
                           else f"<font size=20><b>{total_cost}</b></font>", styles['body']))
    story.append(Spacer(1, 8))

    cost_items = data.get('costs', {}).get('items', [])
    if cost_items:
        max_amount = max(item.get('amount', 0) for item in cost_items) or 1
        for item in cost_items:
            amount = item.get('amount', 0)
            row_data = [[
                Paragraph(item.get('name', ''), styles['body']),
                HorizontalBar(amount, max_amount, width=240, height=12,
                             fill_color=MID_GREEN),
                Paragraph(f"<b>${amount:,}</b>", ParagraphStyle('', fontName='Helvetica-Bold',
                    fontSize=9, textColor=BODY_TEXT, alignment=TA_RIGHT)),
            ]]
            row_table = Table(row_data, colWidths=[130, 270, 70])
            row_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(row_table)

    # ---- TIMELINE ----
    story.append(Spacer(1, 16))
    story.append(Paragraph("Timeline", styles['h2']))
    story.append(Paragraph("A simple phased timeline based on your likely next steps.", styles['body']))
    story.append(Spacer(1, 8))

    timeline = data.get('timeline', [])
    for entry in timeline:
        tl_content = []
        month = entry.get('month', '')
        label = entry.get('label', '')
        tasks = entry.get('tasks', '')
        tl_content.append(Paragraph(
            f"<font size=7 color='#2D6A4F'><b>{month.upper()}</b></font>", styles['body']))
        tl_content.append(Paragraph(f"<b>{label}</b>", styles['body_bold']))
        tl_content.append(Paragraph(tasks, styles['small']))
        tl_content.append(Spacer(1, 2))
        tl_content.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))
        story.append(KeepTogether(tl_content))

    # ---- DISCLAIMER ----
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=AMBER, spaceAfter=8))
    disclaimer_date = data.get('dataDisclaimer') or \
        "Data valid as of March 24, 2026 — verify current program details on official sites."
    story.append(Paragraph(
        f"{disclaimer_date} "
        "This report is for informational purposes only and is not legal or immigration advice. "
        "Always consult a licensed Regulated Canadian Immigration Consultant (RCIC) or immigration lawyer.",
        styles['disclaimer']))

    # BUILD
    doc.build(story, onFirstPage=add_page_furniture, onLaterPages=add_page_furniture)
    print(f"Report generated: {output_path}")


# ============================================================
# SAMPLE DATA (from the actual report)
# ============================================================

sample_data = {
    "crs": {"total": 365, "competitiveness": "Below current Express Entry draws but competitive for PNP",
            "keyInsight": "Provincial nomination (+600 points) is your most viable path to Express Entry selection"},
    "profile": {
        "summary": "38-year-old Kazakhstani professional with Bachelor's from Canada, strong IELTS scores (mostly CLB 9), 11 years foreign skilled work experience. Currently outside Canada with spouse (PhD) and 2 children. CRS 365 puts you below current draw cutoffs but within range for Provincial Nominee Programs.",
        "strengths": [
            "Canadian Bachelor's degree eliminates ECA requirement",
            "Strong English proficiency (IELTS R:8.5 W:8.0 L:7.0 S:8.5)",
            "Extensive 11 years skilled work experience in TEER 1 occupation",
            "Spouse with PhD adds valuable points",
            "Sufficient settlement funds for family of 4",
        ],
        "gaps": [
            "No French language skills (24 potential points lost)",
            "No Canadian work experience (80 points lost)",
            "Age 38 reduces points significantly (55 points lost from maximum)",
            "CRS 365 below current Express Entry draw cutoffs",
        ],
    },
    "scoreAnalysis": {
        "losses": [
            {"category": "Age", "currentPoints": 55, "maxPoints": 110, "pointsLost": 55,
             "fixable": False, "explanation": "At age 38, you lose significant age points compared to candidates under 30"},
            {"category": "Second Language (French)", "currentPoints": 0, "maxPoints": 24, "pointsLost": 24,
             "fixable": True, "explanation": "No French language test results - French proficiency adds valuable CRS points"},
            {"category": "Canadian Work Experience", "currentPoints": 0, "maxPoints": 80, "pointsLost": 80,
             "fixable": True, "explanation": "No Canadian work experience significantly impacts your score"},
            {"category": "First Language", "currentPoints": 103, "maxPoints": 136, "pointsLost": 33,
             "fixable": True, "explanation": "IELTS Listening 7.0 (CLB 7) instead of 8.0+ (CLB 9) reduces points - all other skills are strong"},
            {"category": "Skill Transferability", "currentPoints": 50, "maxPoints": 100, "pointsLost": 50,
             "fixable": True, "explanation": "Without Canadian work experience, you miss skill transferability combinations"},
        ],
        "opportunities": [
            {"action": "Apply for Provincial Nominee Program", "pointsGain": 600, "difficulty": "medium",
             "timeframe": "6-12 months", "cost": "$350-2,000 CAD"},
            {"action": "Learn French to TEF/TCF CLB 5 level (B2 equivalent)", "pointsGain": 24,
             "difficulty": "hard", "timeframe": "12-18 months", "cost": "$2,000-4,000 CAD"},
            {"action": "Improve IELTS Listening from 7.0 to 8.0 (CLB 7 to CLB 9)", "pointsGain": 6,
             "difficulty": "medium", "timeframe": "2-4 months", "cost": "$320 CAD"},
        ],
        "projectedScore": "Your score could go from 365 → 395, which puts you in range for French-language draws (cutoff 393-400) and Trade draws (350-400)",
    },
    "pathways": [
        {"rank": 1, "name": "Saskatchewan SINP", "stream": "International Skilled Worker - Express Entry Sub-category",
         "chance": 75, "timeline": "6-8 months", "cost": "$350 + federal fees", "status": "active",
         "why": "No job offer required, accepts IELTS CLB 7+, 11 years experience highly valued, sector-based allocation favors skilled professionals",
         "requirements": [
             {"item": "Express Entry profile active", "met": True},
             {"item": "IELTS CLB 7+ (you have CLB 7-9)", "met": True},
             {"item": "Education assessment (Canadian degree exempt)", "met": True},
             {"item": "Skilled work experience in last 10 years", "met": True},
             {"item": "Settlement funds ($28,362 for family of 4)", "met": True},
             {"item": "Points threshold (varies by draw)", "met": True},
         ],
         "details": {
             "description": "Saskatchewan International Skilled Worker program targeting Express Entry candidates. No job offer required, uses points-based system favoring education, work experience, and language skills.",
             "applicationProcess": ["Create Express Entry profile", "Submit SINP Expression of Interest", "Wait for Saskatchewan invitation",
                                    "Submit complete SINP application", "Receive provincial nomination", "Accept nomination in Express Entry", "Apply for permanent residence"],
             "processingTime": "4-6 months for SINP + 6 months federal processing",
             "officialLink": "https://www.saskatchewan.ca/residents/moving-to-saskatchewan/live-in-saskatchewan/by-immigrating/saskatchewan-immigrant-nominee-program",
             "alternatives": "Consider Alberta AAIP or Ontario OINP as backup options",
             "improvementTips": "Strong profile - focus on complete documentation and meeting settlement funds requirement",
         }},
        {"rank": 2, "name": "Alberta AAIP", "stream": "Alberta Express Entry Stream",
         "chance": 70, "timeline": "6-10 months", "cost": "$500 + federal fees", "status": "active",
         "why": "Frequent draws, no job offer required for many occupations, strong demand for skilled professionals, increased 2026 allocation",
         "requirements": [
             {"item": "Express Entry profile active", "met": True},
             {"item": "IELTS CLB 7+", "met": True},
             {"item": "Work experience in eligible occupation", "met": True},
             {"item": "Intent to live in Alberta", "met": True},
             {"item": "Connection to Alberta (preferred not required)", "met": False},
         ],
         "details": {
             "description": "Alberta's main PNP stream for Express Entry candidates.",
             "applicationProcess": ["Create Express Entry profile", "Register for Alberta AAIP", "Receive Alberta invitation", "Submit application"],
             "processingTime": "2-4 months provincial + 4-6 months federal",
             "alternatives": "Saskatchewan SINP as primary alternative",
             "improvementTips": "Build Alberta connection through job search, networking, or employer outreach",
         }},
        {"rank": 3, "name": "French-Language Proficiency Category", "stream": "Express Entry Category-Based Selection",
         "chance": 45, "timeline": "12-18 months (including French study)", "cost": "$2,000-4,000 + test fees",
         "status": "requires_action",
         "why": "Strong English base makes French learning achievable, recent draws at CRS 393 (you'd reach ~395 with French CLB 5), regular draws in 2026",
         "requirements": [
             {"item": "French CLB 7+ in all four abilities", "met": False},
             {"item": "English CLB 5+ in all four abilities", "met": True},
             {"item": "Express Entry eligibility", "met": True},
             {"item": "Minimum 12 months skilled work experience", "met": True},
         ],
         "details": {"description": "Category-based Express Entry draw for French speakers."}},
        {"rank": 4, "name": "Ontario OINP", "stream": "Human Capital Priorities or Masters Graduate",
         "chance": 35, "timeline": "12-18 months", "cost": "$1,500-2,000 + federal fees", "status": "changing",
         "why": "Canadian Bachelor's qualifies for consideration, but program redesign creates uncertainty, draw frequency reduced",
         "requirements": [
             {"item": "Canadian Bachelor's degree (1+ years)", "met": True},
             {"item": "English CLB 7+", "met": True},
             {"item": "Work experience in eligible occupation", "met": True},
             {"item": "Intent to live in Ontario", "met": True},
             {"item": "Meet invitation criteria (varies by draw)", "met": False},
         ]},
        {"rank": 5, "name": "BC PNP", "stream": "Skills Immigration - Express Entry BC",
         "chance": 25, "timeline": "8-12 months", "cost": "$1,750 + federal fees", "status": "limited",
         "why": "High-scoring candidates preferred, limited spots for general skilled workers, competitive SIRS points system",
         "requirements": [
             {"item": "Express Entry profile active", "met": True},
             {"item": "Work experience in eligible occupation", "met": True},
             {"item": "English CLB 7+", "met": True},
             {"item": "Competitive SIRS score (varies by draw)", "met": False},
             {"item": "Intent to live and work in BC", "met": True},
         ]},
    ],
    "actionPlan": [
        {"step": 1, "action": "Create Express Entry profile immediately", "where": "canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry", "cost": "$0 CAD", "time": "1-2 hours", "priority": "urgent"},
        {"step": 2, "action": "Submit Saskatchewan SINP Expression of Interest", "where": "immigratesask.ca", "cost": "$0 CAD", "time": "2-3 hours", "priority": "urgent"},
        {"step": 3, "action": "Submit Alberta AAIP Expression of Interest", "where": "albertaimmigration.ca", "cost": "$0 CAD", "time": "2-3 hours", "priority": "high"},
        {"step": 4, "action": "Research French language programs and begin TEF/TCF preparation", "where": "centredevaluation.ca or france-education-international.fr", "cost": "$2,000-4,000 CAD", "time": "12-18 months", "priority": "medium"},
        {"step": 5, "action": "Book IELTS retake to improve Listening from 7.0 to 8.0", "where": "ielts.org", "cost": "$320 CAD", "time": "2-4 months prep", "priority": "medium"},
        {"step": 6, "action": "Gather and organize all supporting documents", "where": "Various (employer letters, transcripts, police certificates)", "cost": "$200-500 CAD", "time": "2-4 weeks", "priority": "high"},
    ],
    "costs": {
        "total": "$6,200-9,700 CAD",
        "items": [
            {"name": "Federal PR application (family of 4)", "amount": 3190},
            {"name": "French language course and TEF test", "amount": 2500},
            {"name": "Medical exams (family of 4)", "amount": 1200},
            {"name": "Saskatchewan SINP application fee", "amount": 350},
            {"name": "Biometrics (family)", "amount": 340},
            {"name": "IELTS retake", "amount": 320},
            {"name": "Police certificates", "amount": 200},
        ]
    },
    "timeline": [
        {"month": "Month 1", "label": "Application Setup", "tasks": "Create Express Entry profile, submit Saskatchewan and Alberta EOIs"},
        {"month": "Month 2-3", "label": "Document Preparation", "tasks": "Gather supporting documents, start French language study"},
        {"month": "Month 4-6", "label": "Provincial Response", "tasks": "Await provincial invitations, continue French study, IELTS retake"},
        {"month": "Month 7-8", "label": "Provincial Application", "tasks": "Submit complete provincial application if invited"},
        {"month": "Month 9-12", "label": "Provincial Processing", "tasks": "Provincial review and nomination decision"},
        {"month": "Month 13-18", "label": "Federal Processing", "tasks": "Submit federal PR application, complete medical and security checks"},
    ],
    "_breakdown": {
        "age": 55, "education": 112, "firstLanguage": 103, "secondLanguage": 0,
        "canadianWork": 0, "spouse": 30, "skillTransfer": 50, "additional": 15,
    }
}


if __name__ == "__main__":
    build_report(sample_data, "/home/claude/PathwayFinder-Report.pdf")
