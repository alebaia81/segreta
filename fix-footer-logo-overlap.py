import re

brand_css = """.footer-brand {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          margin-right: var(--spacing-md);
        }
        .brand-segreta {
          font-family: var(--font-sans);
          font-size: 1.8rem;
          font-weight: 300;
          letter-spacing: 0.35em;
          color: var(--accent-gold);
          text-transform: uppercase;
          line-height: 1;
        }
        .brand-style {
          font-family: 'Great Vibes', cursive;
          font-size: 2rem;
          color: #E295AB;
          position: absolute;
          right: 0px;
          bottom: -16px;
          font-weight: 400;
          line-height: 1;
        }"""

for filename in ['src/pages/Home.jsx', 'src/pages/Shop.jsx']:
    with open(filename, 'r') as f:
        content = f.read()
    
    # Replace the CSS
    content = re.sub(
        r'\.footer-brand\s*\{.*?\.brand-style\s*\{[^}]*\}',
        brand_css,
        content,
        flags=re.DOTALL
    )
    
    with open(filename, 'w') as f:
        f.write(content)

