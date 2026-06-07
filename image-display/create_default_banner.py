import os
from PIL import Image, ImageDraw, ImageFont

def create_banner():
    # 1. Dimensions
    width, height = 1920, 1080
    
    # 2. Create image with dark premium background (#172339)
    img = Image.new('RGB', (width, height), color='#172339')
    draw = ImageDraw.Draw(img)
    
    # 3. Load font
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "fonts", "Montserrat-Bold.otf")
    
    try:
        font_large = ImageFont.truetype(font_path, 80)
        font_sub = ImageFont.truetype(font_path, 40)
    except IOError:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    # 4. Draw premium decorative shapes
    # Draw a nice clean red bar (#ED1C1F) at the top
    draw.rectangle([0, 0, width, 20], fill='#ED1C1F')
    
    # Draw a subtle diagonal accent line/polygon
    draw.polygon([(0, height), (300, height), (150, height - 150), (0, height - 150)], fill='#1A2A44')
    draw.polygon([(width, 0), (width - 300, 0), (width - 150, 150), (width, 150)], fill='#1A2A44')
    
    # 5. Draw Text
    text_main = "AZ POOL ARENA"
    text_sub = "BẢNG HIỂN THỊ THÔNG TIN"
    
    # Draw main text in center
    w_main, h_main = draw.textsize(text_main, font=font_large) if hasattr(draw, "textsize") else (800, 100) # fallback size estimation
    # PIL 10+ uses textbbox
    if hasattr(draw, "textbbox"):
        bbox = draw.textbbox((0, 0), text_main, font=font_large)
        w_main, h_main = bbox[2] - bbox[0], bbox[3] - bbox[1]
        
    draw.text(((width - w_main) / 2, (height - h_main) / 2 - 50), text_main, fill='#FFFFFF', font=font_large)
    
    # Draw sub text below main text
    w_sub, h_sub = (600, 50)
    if hasattr(draw, "textbbox"):
        bbox_sub = draw.textbbox((0, 0), text_sub, font=font_sub)
        w_sub, h_sub = bbox_sub[2] - bbox_sub[0], bbox_sub[3] - bbox_sub[1]
        
    draw.text(((width - w_sub) / 2, (height - h_sub) / 2 + 50), text_sub, fill='#ACB3C3', font=font_sub)
    
    # Draw logo placeholder or decorative circle
    draw.ellipse([(width/2 - 10, height/2 - 10), (width/2 + 10, height/2 + 10)], fill='#ED1C1F')
    
    # 6. Save image
    output_path = os.path.join(current_dir, "default_banner.png")
    img.save(output_path)
    print(f"Created default banner at: {output_path}")

if __name__ == "__main__":
    create_banner()
