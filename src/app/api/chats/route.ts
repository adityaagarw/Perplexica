import db from '@/lib/db';
import { chats as chatsTable, messages } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const GET = async (req: Request) => {
  try {
    let chats = await db.query.chats.findMany();
    chats = chats.reverse();
    return Response.json({ chats: chats }, { status: 200 });
  } catch (err) {
    console.error('Error in getting chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: Request) => {
  try {
    const { chatIds } = await req.json();

    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return Response.json(
        { message: 'Invalid request body. Expected an array of chat IDs.' },
        { status: 400 },
      );
    }

    await db.delete(messages).where(inArray(messages.chatId, chatIds));
    await db.delete(chatsTable).where(inArray(chatsTable.id, chatIds));

    return Response.json({ message: 'Chats deleted successfully' }, { status: 200 });
  } catch (err) {
    console.error('Error in deleting chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
