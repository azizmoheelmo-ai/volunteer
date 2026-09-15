import { prisma } from "../lib/prisma.js";
import type { NotificationType } from "../constants.js";

export function notify(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedOpportunityId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      relatedOpportunityId: params.relatedOpportunityId,
    },
  });
}
