from pathlib import Path
import argparse, shutil, subprocess, sys
p=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description="Dựng lại Super App; tùy chọn nhập bản sao trước khi dựng.")
parser.add_argument("--backup",type=Path)
args=parser.parse_args()
if args.backup:
    subprocess.run([sys.executable,str(p/"source/tools/import_content.py"),str(args.backup.resolve())],check=True)
subprocess.run([sys.executable,str(p/"source/build.py")],check=True)
shutil.copyfile(p/"source/dist/super-app.html",p/"index.html")
print("Đã cập nhật index.html. Tải tệp này lên thư mục gốc GitHub đang nối với Vercel.")
