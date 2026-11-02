"""Original deterministic illustration fixtures. Optional regeneration requires Pillow."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'database'/'demo-images'
OUT.mkdir(parents=True,exist_ok=True)
FONT=Path('C:/Windows/Fonts')
def font(size,bold=False):
    name='segoeuib.ttf' if bold else 'segoeui.ttf'
    if (FONT/name).exists(): return ImageFont.truetype(str(FONT/name),size)
    return ImageFont.truetype('DejaVuSans.ttf',size)
for project in (1,2):
    for screen in (1,2,3):
        for version in (1,2):
            warm=project==1
            bg='#f6f2eb' if warm else '#f0f4ef'
            ink='#304239' if warm else '#234248'
            accent=('#bb704e' if version==1 else '#39785d') if warm else ('#398690' if version==1 else '#b07735')
            im=Image.new('RGB',(1000,500),bg); d=ImageDraw.Draw(im)
            def text(x,y,s,size=16,bold=False,color=ink): d.text((x,y),s,font=font(size,bold),fill=color)
            def box(x,y,w,h,fill,r=12): d.rounded_rectangle((x,y,x+w,y+h),radius=r,fill=fill)
            text(43,23,'lumi.' if warm else 'nomad.',29,True)
            text(360,32,'Bộ sưu tập' if warm else 'Điểm đến',13)
            text(490,32,'Câu chuyện',13); text(600,32,'Liên hệ',13)
            box(839,22,117,36,ink,18); text(861,30,'Khám phá ↗',13,False,'white')
            d.line((40,80,960,80),fill='#dcded6',width=1)
            if screen==1:
                text(45,120,'THIẾT KẾ CHO CUỘC SỐNG' if warm else 'NHỮNG CHUYẾN ĐI CÓ Ý NGHĨA',12,True,accent)
                text(43,157,'Một góc nhỏ,' if warm else 'Đi chậm lại,',46,True)
                text(43,214,'nhiều cảm hứng.' if warm else 'thấy nhiều hơn.',46,True)
                text(45,290,'Để mỗi ngày đều là một điều đáng nhớ.',16)
                text(45,319,'Tìm sự bình yên trong những điều giản dị.',14,False,'#6f7c72')
                box(45,375,181,44,ink,22); text(68,386,'Xem bộ sưu tập →' if warm else 'Tìm chuyến đi →',15,False,'white')
                box(563,108,393,341,'#e0d6c7' if warm else '#c6d6ce',24)
                # The first version's reference button centre is exactly (750,150).
                cx,cy=(750,150) if version==1 else (777,190)
                box(cx-78,cy-19,156,38,accent,19); text(cx-53,cy-12,'Bắt đầu ngay',16,True,'white')
                if warm:
                    d.ellipse((600,404,916,448),fill='#c4b5a2')
                    box(635,257,260,115,'#cc9875' if version==1 else '#8eaa83',35)
                    box(647,232,235,90,'#d8ae8d' if version==1 else '#9eb792',32)
                    box(618,290,35,88,'#bc8c6b',14);box(878,290,35,88,'#bc8c6b',14)
                    d.line((650,370,640,415),fill=ink,width=8); d.line((880,370,890,415),fill=ink,width=8)
                    box(680,259,65,52,'#f1e6d8',12);box(756,259,65,52,'#c57f53',12)
                else:
                    d.ellipse((838,227,898,287),fill='#f3df9c')
                    d.polygon([(570,420),(698,227),(835,420)],fill='#678d79')
                    d.polygon([(685,440),(836,275),(956,440)],fill='#3c705e')
                    d.polygon([(563,449),(779,370),(956,449)],fill='#9cb09c')
                text(581,462,'BỘ SƯU TẬP 2026' if warm else 'VIỆT NAM · HÀNH TRÌNH MỚI',11,False,'#69776e')
            elif screen==2:
                text(45,108,'Không gian của bạn' if warm else 'Chọn hành trình tiếp theo',35,True)
                text(45,157,'Được chọn lọc bằng sự quan tâm đến từng chi tiết.',15,False,'#6f7c72')
                for k in range(3):
                    x=45+k*310; box(x,204,289,210,['#e5d6c2','#c8d6c6','#dec9b9'][k],16)
                    if warm:
                        d.ellipse((x+64,337,x+229,384),fill='#c0ac95');box(x+82,253,130,95,['#8f9a75','#a5795e','#d2ac67'][k],29)
                        d.line((x+100,347,x+93,379),fill=ink,width=6);d.line((x+194,347,x+201,379),fill=ink,width=6)
                    else:
                        d.polygon([(x+15,402),(x+127,241),(x+275,402)],fill=['#6a9076','#9c8a62','#699a98'][k])
                        d.ellipse((x+203,222,x+251,270),fill='#f7e7bd')
                    text(x+4,427,(['Ghế thư giãn','Bàn bên cửa sổ','Góc đọc sách'] if warm else ['Đà Lạt','Hà Giang','Ninh Bình'])[k],18,True)
                    text(x+4,457,'Từ 1.290.000 đ' if warm else '3 ngày · Khởi hành mỗi tuần',13,False,accent)
                if version==2: box(781,110,172,37,accent,18);text(801,119,'Xem tất cả →',14,True,'white')
            else:
                box(45,109,437,340,'#d5dccb' if warm else '#c5d9cf',20)
                d.ellipse((102,354,421,424),fill='#bbc5b1')
                if warm:
                    box(148,187,210,155,'#a67c56' if version==1 else '#8b956b',39)
                    box(127,272,250,89,'#b5916a' if version==1 else '#99a27b',27)
                    d.line((156,354,143,411),fill=ink,width=9);d.line((349,354,361,411),fill=ink,width=9)
                else:
                    d.polygon([(80,380),(254,152),(440,380)],fill='#6e987d');d.polygon([(170,449),(340,232),(482,449)],fill='#39725e')
                text(541,120,'BỘ SƯU TẬP CHẬM' if warm else 'HÀNH TRÌNH CHỌN LỌC',12,True,accent)
                text(538,159,'Ghế Mộc' if warm else 'Một thoáng Đà Lạt',38,True)
                text(541,222,'Một khoảng nghỉ dành riêng cho bạn.',16)
                text(541,254,'Vật liệu tự nhiên. Cảm hứng bền lâu.' if warm else 'Rừng thông, sương sớm và những câu chuyện.',14,False,'#64766b')
                text(541,305,'2.490.000 đ' if warm else '3 ngày · 2 đêm',28,True)
                box(541,366,250 if version==1 else 330,48,accent,24)
                text(569,378,'Thêm vào giỏ hàng →' if warm else 'Khám phá hành trình →',16,True,'white')
            im.save(OUT/f'p{project}-s{screen}-v{version}.png',optimize=True)
print('Created 12 original PNG fixtures, each 1000 x 500.')
