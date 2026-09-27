/**
 * SmritiSaathi CareCompass Geofence Alert Plugin
 * Compatible with OpenWA Gateway (https://github.com/rmyndharis/OpenWA-plugins)
 *
 * Provides a dedicated zero-interaction webhook endpoint (/webhook/geofence-alert)
 * that autonomously sends emergency WhatsApp alerts when a patient breaches their safe perimeter.
 */

module.exports = function setup(ctx) {
  // Register inbound webhook listener
  if (ctx && typeof ctx.registerWebhook === 'function') {
    ctx.registerWebhook('/webhook/geofence-alert', async (req, res) => {
      try {
        const payload = req.body || {};
        const {
          chatId,
          to,
          text,
          message,
          patientName = 'Elder Patient',
          event = 'geofence.breach',
        } = payload;

        const messageText = text || message;
        let cleanDigits = (to || '').replace(/[^0-9]/g, '');
        if (cleanDigits.startsWith('0')) cleanDigits = cleanDigits.replace(/^0+/, '');
        if (cleanDigits.length === 10) cleanDigits = `91${cleanDigits}`;

        const targetChat = chatId || (cleanDigits ? `${cleanDigits}@c.us` : null);

        if (!targetChat || !messageText) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: targetChat (or to) and text (or message)',
          });
        }

        // Send WhatsApp message using OpenWA typed messages interface
        let sendResult = null;
        if (ctx.messages && typeof ctx.messages.sendText === 'function') {
          sendResult = await ctx.messages.sendText('default', targetChat, messageText);
        }

        return res.status(200).json({
          success: true,
          provider: 'openwa-plugin',
          pluginId: 'smritisaathi-geofence-alert',
          event,
          patientName,
          targetChat,
          messageId: sendResult && sendResult.id ? sendResult.id : `openwa-plg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          details: 'Autonomous WhatsApp alert delivered via OpenWA gateway plugin (0 wa.me interaction required)',
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: err && err.message ? err.message : 'OpenWA message dispatch failed',
        });
      }
    });
  }
};
