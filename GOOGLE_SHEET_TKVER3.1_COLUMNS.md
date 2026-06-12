# Google Sheet columns gợi ý cho TKver3.2

Các cột cơ bản:
- username
- password
- role
- full_name
- status

Cột mở rộng:
- vip_access: Y/N, cho phép dùng toàn bộ app VIP
- family_access: Y/N, đánh dấu nhóm gia đình
- vault_access: Y/N, tham khảo; Vault hiện vẫn chỉ user 0947924444
- create_video: Y/N, cấp quyền riêng cho app Create Video
- ai_prompt: Y/N, cấp quyền riêng cho app AI Prompt
- app_order: JSON array, ví dụ ["ai-prompt","create-video","qr-code"]
- usage_count: dùng sau khi nối tracking vào Sheet
- last_used: dùng sau khi nối tracking vào Sheet
- mood_tracking: Y/N, bật/tắt trải nghiệm cảm xúc
