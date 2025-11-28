import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversationId, content, encrypted, encryptedPayloads, nonce, senderDeviceId } = req.body;

  // Vérifier le JWT dans le header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insérer le message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        from_user_id: decoded.userId,
        content: encrypted ? '[Encrypted Message]' : content,
        encrypted: encrypted || false,
        encrypted_payloads: encryptedPayloads || null,
        nonce: nonce || null,
        sender_device_id: senderDeviceId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Broadcast via Supabase Realtime (automatique)
    // Le client frontend qui subscribe recevra automatiquement

    return res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
