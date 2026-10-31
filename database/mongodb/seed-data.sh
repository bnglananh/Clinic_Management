#!/bin/bash
# Nạp dữ liệu mẫu JSON (database/mongodb/seed/<collection>.json) vào clinic_db.
# Docker tự chạy file này sau init-mongo.js trong lần khởi tạo đầu tiên.
# Chạy tay (ngoài Docker):  SEED_DIR=database/mongodb/seed bash database/mongodb/seed-data.sh
#
# Lưu ý: entrypoint của image mongo nạp file .sh bằng "source", nên KHÔNG dùng
# "exit" hay "set -e" ở đây – chúng sẽ làm dừng luôn cả container.

SEED_DIR="${SEED_DIR:-/seed}"
SEED_URI="${SEED_URI:-mongodb://localhost:27017/clinic_db}"

seed_files=$(ls "$SEED_DIR"/*.json 2>/dev/null)
if [ -z "$seed_files" ]; then
  echo "--> Không có file JSON trong $SEED_DIR, backend sẽ tự nạp dữ liệu mẫu khi khởi động."
else
  for seed_file in $seed_files; do
    seed_collection="$(basename "$seed_file" .json)"
    echo "--> Nạp $seed_file vào collection $seed_collection"
    mongoimport --uri "$SEED_URI" --collection "$seed_collection" --file "$seed_file" --jsonArray --mode upsert
  done
  echo "--> Hoàn tất nạp dữ liệu mẫu MongoDB."
fi
