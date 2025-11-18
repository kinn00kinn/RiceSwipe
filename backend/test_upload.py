import os
import boto3
from pathlib import Path
from dotenv import load_dotenv
from uuid import uuid4
from supabase import create_client, Client
import time

# .envファイルから環境変数を読み込む
load_dotenv()

# 環境変数の取得
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
USER_ID=os.getenv('USER_ID')

# 必須環境変数のチェック
if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
    raise ValueError("R2の環境変数が設定されていません")

# R2クライアントの初期化
print("🔧 R2クライアントを初期化中...")
s3_client = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto',
    config=boto3.session.Config(
        signature_version='s3v4',
        retries={'max_attempts': 3, 'mode': 'standard'}
    )
)

# Supabaseクライアントの初期化（オプション）
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    print("🔧 Supabaseクライアントを初期化中...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase接続完了")
else:
    print("⚠️  Supabase環境変数が未設定（メタデータ保存はスキップされます）")

def upload_video_to_r2(file_path: str, user_id: str = "test-user", 
                       title: str = None, description: str = None) -> dict:
    """
    動画ファイルをCloudflare R2にアップロードし、Supabaseにメタデータを保存
    
    Args:
        file_path: アップロードする動画ファイルのパス
        user_id: ユーザーID
        title: 動画タイトル（省略時はファイル名）
        description: 動画説明
    
    Returns:
        dict: アップロード結果
    """
    try:
        # ファイルの存在確認
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"ファイルが見つかりません: {file_path}")
        
        # ファイル情報の取得
        file_name = Path(file_path).name
        file_size = os.path.getsize(file_path)
        
        # タイトルのデフォルト値
        if not title:
            title = Path(file_path).stem
        
        # ユニークなIDとオブジェクトキーを生成
        video_id = str(uuid4())
        object_key = f"{user_id}/{video_id}-{file_name}"
        
        print(f"\n📤 アップロード開始...")
        print(f"   動画ID: {video_id}")
        print(f"   ファイル: {file_name}")
        print(f"   サイズ: {file_size / (1024*1024):.2f} MB")
        print(f"   タイトル: {title}")
        print(f"   オブジェクトキー: {object_key}")
        
        # Content-Typeの判定
        content_type = 'video/mp4'
        if file_name.lower().endswith('.webm'):
            content_type = 'video/webm'
        elif file_name.lower().endswith('.mov'):
            content_type = 'video/quicktime'
        
        # === R2にアップロード ===
        print(f"\n🔄 R2にアップロード中...", end='', flush=True)
        start_time = time.time()
        
        with open(file_path, 'rb') as file_data:
            s3_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=object_key,
                Body=file_data,
                ContentType=content_type
            )
        
        upload_time = time.time() - start_time
        print(f" 完了! ({upload_time:.2f}秒)")
        
        # 公開URLの生成
        public_domain = os.getenv('NEXT_PUBLIC_R2_PUBLIC_DOMAIN')
        public_url = f"https://{public_domain}/{object_key}" if public_domain else None
        
        result = {
            'success': True,
            'video_id': video_id,
            'object_key': object_key,
            'bucket': R2_BUCKET_NAME,
            'file_name': file_name,
            'file_size': file_size,
            'content_type': content_type,
            'upload_time': upload_time,
            'title': title
        }
        
        if public_url:
            result['public_url'] = public_url
        
        # === Supabaseにメタデータを保存 ===
        if supabase:
            print(f"💾 Supabaseにメタデータを保存中...", end='', flush=True)
            try:
                data = {
                    'id': video_id,
                    'r2_object_key': object_key,
                    'title': title,
                    'description': description,
                    'author_id': user_id,
                }
                
                response = supabase.table('videos').insert(data).execute()
                print(" 完了!")
                result['supabase_saved'] = True
                result['supabase_data'] = response.data
                
            except Exception as e:
                print(f" エラー: {str(e)}")
                result['supabase_saved'] = False
                result['supabase_error'] = str(e)
        else:
            result['supabase_saved'] = False
            result['supabase_error'] = "Supabaseクライアントが未初期化"
        
        print(f"\n✅ アップロード完了!")
        if public_url:
            print(f"   公開URL: {public_url}")
        
        return result
        
    except Exception as e:
        print(f"\n❌ エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }

def list_r2_objects(prefix: str = "", max_keys: int = 10) -> list:
    """R2バケット内のオブジェクト一覧を取得"""
    try:
        response = s3_client.list_objects_v2(
            Bucket=R2_BUCKET_NAME,
            Prefix=prefix,
            MaxKeys=max_keys
        )
        
        if 'Contents' not in response:
            print("📦 バケットは空です")
            return []
        
        objects = []
        print(f"\n📦 バケット内のオブジェクト ({len(response['Contents'])}件):")
        for obj in response['Contents']:
            print(f"   - {obj['Key']} ({obj['Size'] / (1024*1024):.2f} MB)")
            objects.append({
                'key': obj['Key'],
                'size': obj['Size'],
                'last_modified': obj['LastModified']
            })
        
        return objects
        
    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        return []

if __name__ == "__main__":
    print("=" * 70)
    print("🎬 Cloudflare R2 + Supabase 動画アップロードテスト")
    print("=" * 70)
    
    # R2接続テスト
    print("\n🔍 R2バケット接続テスト...")
    try:
        s3_client.head_bucket(Bucket=R2_BUCKET_NAME)
        print(f"✅ バケット '{R2_BUCKET_NAME}' に接続成功!")
    except Exception as e:
        print(f"❌ バケット接続エラー: {str(e)}")
        exit(1)
    
    # 既存オブジェクトの確認
    list_r2_objects(max_keys=5)
    
    # アップロードテスト
    print("\n" + "=" * 70)
    test_file = input("\n📁 アップロードするファイルパスを入力してください\n   (Enter でスキップ): ").strip()
    
    if test_file and os.path.exists(test_file):
        title = input("📝 動画タイトルを入力してください (Enter でファイル名): ").strip()
        description = input("📄 説明を入力してください (Enter でスキップ): ").strip() or None
        
        result = upload_video_to_r2(
            test_file, 
            title=title if title else None,
            description=description,
            user_id=USER_ID
        )
        
        if result['success']:
            print("\n" + "=" * 70)
            print("✨ 処理完了!")
            print("=" * 70)
            print(f"動画ID: {result.get('video_id')}")
            print(f"R2アップロード: ✅ 成功 ({result.get('upload_time', 0):.2f}秒)")
            print(f"Supabase保存: {'✅ 成功' if result.get('supabase_saved') else '❌ 失敗'}")
            if not result.get('supabase_saved'):
                print(f"  理由: {result.get('supabase_error')}")
    elif test_file:
        print(f"❌ ファイルが見つかりません: {test_file}")
    else:
        print("\n⏭️  アップロードをスキップしました")
    
    print("\n✅ テスト完了!")