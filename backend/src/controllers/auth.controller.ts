import { Request, Response, NextFunction } from 'express';
import { createOAuth2Client, GMAIL_SCOPES } from '../config/gmail';
import { prisma } from '../config/database';
import { encrypt } from '../utils/crypto';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export async function login(_req: Request, res: Response) {
  const client = createOAuth2Client();
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
  });

  res.json({ authUrl });
}

export async function callback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return res.status(400).json({ error: 'Failed to obtain tokens' });
    }

    // Get user info using access token directly
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      logger.error({ status: userInfoResponse.status }, 'Failed to fetch user info');
      return res.status(400).json({ error: 'Failed to fetch user info from Google' });
    }

    const userInfo: any = await userInfoResponse.json();
    const email = userInfo.email;
    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email' });
    }

    // Upsert user with encrypted tokens
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: userInfo.name || null,
        picture: userInfo.picture || null,
        encryptedAccessToken: encrypt(tokens.access_token),
        encryptedRefreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      update: {
        name: userInfo.name || null,
        picture: userInfo.picture || null,
        encryptedAccessToken: encrypt(tokens.access_token),
        encryptedRefreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    logger.info({ email }, 'User authenticated');

    // Redirect to frontend with user ID
    res.redirect(`${env.FRONTEND_URL}/auth/callback?userId=${user.id}`);
  } catch (error) {
    next(error);
  }
}

export async function status(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.json({ authenticated: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.json({ authenticated: false });
    }

    res.json({ authenticated: true, user });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          tokenExpiresAt: null,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
