import requests
import time
import sys
import os

BASE_URL = 'http://localhost:8000/api/v1/render'

print('[*] Submitting job...')
response = requests.post(
    f'{BASE_URL}/start',
    json={
        'prompt': 'A sleek red Coca-Cola can, photorealistic, 4k',
        'brand_image_url': 'https://res.cloudinary.com/dtmyvjdff/image/upload/v1772915737/ttlig7kbrvwmsylxvlob.png',
        'video_url': 'https://res.cloudinary.com/dtmyvjdff/video/upload/v1772913787/shortpepsi_t3fo9s.mp4',
        'mask_url': 'https://res.cloudinary.com/dtmyvjdff/image/upload/v1772913764/mask_aqfckt.png'
    }
)

if response.status_code != 202:
    print(f'❌ Failed to start job: {response.status_code} - {response.text}')
    sys.exit(1)

data = response.json()
job_id = data['job_id']
print(f'✅ Job started! ID: {job_id}')

for i in range(20):
    time.sleep(5)
    print(f'[*] Polling status... ({i*5}s)')
    stat_res = requests.get(f'{BASE_URL}/status/{job_id}')
    
    if stat_res.status_code != 200:
        print(f'❌ Polling failed: {stat_res.status_code} - {stat_res.text}')
        sys.exit(1)
        
    stat_data = stat_res.json()
    status = stat_data['status']
    print(f'  -> Status: {status}')
    
    if status == 'completed':
        print(f'🎉 Success! Output: {stat_data.get("output_video_url")}')
        break
    elif status in ['failed', 'canceled']:
        print(f'❌ Job failed/canceled: {stat_data.get("error")}')
        break
