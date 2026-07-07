import re

brand_html = """<div className="footer-brand">
                <span className="brand-segreta">SEGRETA</span>
                <span className="brand-style">style</span>
              </div>"""

brand_css = """.footer-brand {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .brand-segreta {
          font-family: var(--font-sans);
          font-size: 1.5rem;
          font-weight: 300;
          letter-spacing: 0.25em;
          color: var(--accent-gold);
          text-transform: uppercase;
        }
        .brand-style {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-style: italic;
          color: #E295AB;
          font-weight: 400;
        }"""

for filename in ['src/pages/Home.jsx', 'src/pages/Shop.jsx']:
    with open(filename, 'r') as f:
        content = f.read()
    
    # Replace the img tag
    content = re.sub(
        r'<img\s+src="/logo-footer\.jpg"\s+alt="Segreta Style Logo"\s+className="footer-logo-img"\s*/>',
        brand_html,
        content,
        flags=re.MULTILINE
    )
    
    # Replace the CSS
    content = re.sub(
        r'\.footer-logo-img\s*\{[^}]*\}',
        brand_css,
        content,
        flags=re.MULTILINE
    )
    
    with open(filename, 'w') as f:
        f.write(content)

