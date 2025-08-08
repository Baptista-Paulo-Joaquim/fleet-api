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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
//import cors from "cors";
const client_1 = require("@prisma/client");
const auth_1 = require("./middleware/auth");
const checkPermission_1 = require("./middleware/checkPermission");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const SECRET = "mySecret@2025";
app.use(express_1.default.json());
// Criar usuário com senha criptografada
app.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, type } = req.body;
    const existing = yield prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(400).json({ error: "Email já está em uso." });
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    const user = yield prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            type,
        },
    });
    res
        .status(201)
        .json({ message: "Usuário criado com sucesso", userId: user.id });
}));
//Login de Usuário
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield prisma.user.findUnique({
        where: { email },
        include: {
            permissions: {
                include: { permission: true },
            },
        },
    });
    if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
    }
    const passwordMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: "Senha incorreta" });
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, type: user.type }, SECRET, {
        expiresIn: "1d",
    });
    const permissions = user.permissions.map((p) => p.permission.type);
    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            type: user.type,
            permissions,
        },
    });
}));
// Cria veiculo
app.post("/vehicles", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { model, plateNumber } = req.body;
    const vehicle = yield prisma.vehicle.create({ data: { model, plateNumber } });
    res.json(vehicle);
}));
// Cria material
app.post("/materials", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description } = req.body;
    const material = yield prisma.material.create({
        data: { name, description },
    });
    res.json(material);
}));
// Atribuir veiculo a user
app.post("/assign-vehicle", auth_1.authenticate, (0, checkPermission_1.checkPermission)("ASSIGN_VEHICLE"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, vehicleId } = req.body;
    const alreadyAssigned = yield prisma.assignedVehicle.findFirst({
        where: {
            vehicleId,
            unassignedAt: null,
        },
    });
    if (alreadyAssigned) {
        return res
            .status(400)
            .json({ error: "Veículo já está atribuído a outro usuário." });
    }
    const vehicleAssignment = yield prisma.assignedVehicle.create({
        data: { userId, vehicleId },
    });
    res.json(vehicleAssignment);
}));
// Desatribuir veiculo a user
app.patch("/unassigned-vehicle/:assignmentId", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { assignmentId } = req.params;
    const updated = yield prisma.assignedVehicle.update({
        where: { id: assignmentId },
        data: { unassignedAt: new Date() },
    });
    res.json(updated);
}));
// Atribuir material ao user
app.post("/assign-material", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, materialId } = req.body;
    const materialAssignment = yield prisma.assignedMaterial.create({
        data: { userId, materialId },
    });
    res.json(materialAssignment);
}));
// Desatribuir material ao user
app.patch("/unassign-material/:assignmentId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { assignmentId } = req.params;
    const updated = yield prisma.assignedMaterial.update({
        where: { id: assignmentId },
        data: { unassignedAt: new Date() },
    });
    res.json(updated);
}));
app.get("/vehicle-history/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const history = yield prisma.assignedVehicle.findMany({
        where: { userId },
        include: { vehicle: true },
    });
    res.json(history);
}));
app.post("/init-permissions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const types = [
        client_1.PermissionType.ASSIGN_VEHICLE,
        client_1.PermissionType.ASSIGN_MATERIAL,
        client_1.PermissionType.UNASSIGN_VEHICLE,
        client_1.PermissionType.UNASSIGN_MATERIAL,
    ];
    for (const type of types) {
        yield prisma.permission.upsert({
            where: { type },
            update: {},
            create: { type },
        });
    }
    res.json({ ok: true });
}));
app.post("/grant-permission", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, permissionType } = req.body;
    const permission = yield prisma.permission.findUnique({
        where: { type: permissionType },
    });
    if (!permission)
        return res.status(400).json({ error: "Permissão inválida" });
    const alreadyHas = yield prisma.userPermission.findFirst({
        where: { userId, permissionId: permission.id },
    });
    if (alreadyHas)
        return res.status(400).json({ error: "Já tem essa permissão" });
    yield prisma.userPermission.create({
        data: { userId, permissionId: permission.id },
    });
    res.json({ success: true });
}));
app.post("/revoke-permission", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, permissionType } = req.body;
    const permission = yield prisma.permission.findUnique({
        where: { type: permissionType },
    });
    if (!permission)
        return res.status(400).json({ error: "Permissão inválida" });
    yield prisma.userPermission.deleteMany({
        where: { userId, permissionId: permission.id },
    });
    res.json({ success: true });
}));
app.listen(5000, () => {
    console.log(`🚚 Fleet API rodando em http://localhost:${5000}`);
});
