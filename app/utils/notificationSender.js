const axios = require('axios');

const sendPushNotification = async ({ fcmToken, title, body, data = {} }) => {
  try {
    await axios.post('https://fcm.googleapis.com/fcm/send', {
      to: fcmToken,
      notification: {
        title,
        body,
      },
      data, // يمكنك تمرير بيانات إضافية مع الإشعار
      priority: 'high',
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${process.env.FCM_SERVER_KEY}`, // Server key من Firebase
      },
    });

    console.log('✅ تم إرسال الإشعار بنجاح');
  } catch (error) {
    console.error('❌ فشل إرسال الإشعار:', error.response?.data || error.message);
  }
};

module.exports = { sendPushNotification };
