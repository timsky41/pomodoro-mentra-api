// api/webhook.js
// MentraOS からのイベントを受信するAPIエンドポイント

export default function handler(req, res) {
  // CORS設定（クロスオリジンリクエスト対応）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTリクエストの処理
  if (req.method === 'POST') {
    try {
      const { event_type, user_id, data } = req.body;
      
      console.log('MentraOS Event Received:', {
        event_type,
        user_id,
        data,
        timestamp: new Date().toISOString()
      });

      // イベントタイプに応じた処理
      switch (event_type) {
        case 'app_activated':
          // アプリが起動された時
          return res.status(200).json({
            message: 'Pomodoro Timer activated',
            action: 'display_welcome',
            content: {
              text: 'ポモドーロタイマー\n準備完了！\nSTARTを押してください',
              duration: 3000
            }
          });

        case 'app_deactivated':
          // アプリが停止された時
          return res.status(200).json({
            message: 'Pomodoro Timer deactivated'
          });

        case 'user_input':
          // ユーザーからの入力（音声コマンドなど）
          const input = data?.input?.toLowerCase() || '';
          
          if (input.includes('start') || input.includes('スタート')) {
            return res.status(200).json({
              message: 'Timer started',
              action: 'start_timer',
              content: {
                text: 'WORK SESSION 1\n25:00\n🍅⏰⭕⭕',
                timer: 1500 // 25分 = 1500秒
              }
            });
          }
          
          if (input.includes('pause') || input.includes('ポーズ')) {
            return res.status(200).json({
              message: 'Timer paused',
              action: 'pause_timer',
              content: {
                text: 'タイマー一時停止\nResumeで再開'
              }
            });
          }

          if (input.includes('reset') || input.includes('リセット')) {
            return res.status(200).json({
              message: 'Timer reset',
              action: 'reset_timer',
              content: {
                text: 'タイマーリセット\n25:00\n⭕⭕⭕⭕'
              }
            });
          }

          break;

        case 'timer_complete':
          // タイマー完了時
          const session = data?.session || 1;
          const isWorkSession = data?.type === 'work';
          
          if (isWorkSession) {
            return res.status(200).json({
              message: 'Work session completed',
              action: 'start_break',
              content: {
                text: '作業完了！\n5分休憩\n🍅🍅⏰⭕',
                notification: 'お疲れ様！5分間休憩しましょう',
                timer: 300 // 5分
              }
            });
          } else {
            return res.status(200).json({
              message: 'Break completed',
              action: 'start_work',
              content: {
                text: '休憩終了！\n次の作業開始\n🍅🍅🍅⏰',
                notification: '休憩終了！次の作業を始めましょう',
                timer: 1500 // 25分
              }
            });
          }

        default:
          return res.status(200).json({
            message: 'Event received',
            event_type
          });
      }

    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // GETリクエスト（ヘルスチェック用）
  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Pomodoro Timer API',
      status: 'running',
      version: '1.0.0',
      endpoints: {
        webhook: '/api/webhook',
        health: '/api/health'
      }
    });
  }

  // その他のメソッドは許可しない
  res.status(405).json({
    error: 'Method not allowed',
    allowed_methods: ['GET', 'POST', 'OPTIONS']
  });
}
