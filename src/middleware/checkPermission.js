"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const checkPermission = (permission) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield prisma.user.findUnique({
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
    });
};
exports.checkPermission = checkPermission;
