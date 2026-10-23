import { createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { env } from '@/config/env.config';
import { BadRequestError, NotFoundError } from '@/shared/errors';
import idCardRepository from '../repositories/id-card.repository';

// Its own key, derived from JWT_SECRET. Signing cards with the login secret
// would make a scanned card usable as an access token for the whole API.
const CARD_KEY = createHmac('sha256', env.JWT_SECRET).update('hallmate:id-card').digest();
const CARD_VALID_FOR = '365d';

class IdCardService {
  /** The student's card: printed details plus a QR that only the API can mint. */
  async myCard(userId: string) {
    const holder = await idCardRepository.findCardholder(userId);
    if (!holder || holder.isDeleted) throw new NotFoundError('Card not found');

    const token = jwt.sign({ sub: holder.id }, CARD_KEY, {
      expiresIn: CARD_VALID_FOR,
      audience: 'id-card',
    });
    const { exp } = jwt.decode(token) as { exp: number };
    return {
      name: holder.name,
      universityId: holder.universityId,
      department: holder.department,
      session: holder.session,
      bloodGroup: holder.bloodGroup,
      photo: holder.photo,
      room: holder.currentRoom?.roomNumber ?? null,
      validUntil: new Date(exp * 1000),
      token, // what the QR encodes; the app may also render it itself
      qrSvg: await QRCode.toString(token, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 }),
    };
  }

  /**
   * What the guard sees after scanning. The token proves the card is genuine;
   * the live account decides if it still counts: a cancelled seat stops the
   * card the same minute, however long the printed card says it's valid.
   */
  async verify(token: string) {
    let userId: string;
    try {
      ({ sub: userId } = jwt.verify(token, CARD_KEY, { audience: 'id-card' }) as { sub: string });
    } catch {
      throw new BadRequestError('This card is not genuine or has expired');
    }
    const holder = await idCardRepository.findCardholder(userId);
    if (!holder || holder.isDeleted) throw new BadRequestError('This card is no longer valid');

    return {
      valid: holder.accountStatus === 'ACTIVE',
      status: holder.accountStatus,
      name: holder.name,
      universityId: holder.universityId,
      photo: holder.photo, // the guard matches the face to the person
      room: holder.currentRoom?.roomNumber ?? null,
    };
  }
}

export default new IdCardService();
