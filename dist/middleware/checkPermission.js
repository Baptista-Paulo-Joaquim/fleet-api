"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const checkPermission = (permission) => {
    return async (req, res, next) => {
        const userId = req.user?.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
        if (!user || user.type !== "STAFF") {
            return res.status(403).json({ error: "Acesso negado" });
        }
        const hasPermission = user.permissions.some((p) => p.permission.type === permission);
        if (!hasPermission) {
            return res
                .status(403)
                .json({ error: "You have no permission to perform this task!" });
        }
        next();
    };
};
exports.checkPermission = checkPermission;
