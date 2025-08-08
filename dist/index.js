"use strict";
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
app.get("/", (req, res) => {
    res.send("API rodando na VPS 🚀");
});
// Criar usuário com senha criptografada
app.post("/signup", async (req, res) => {
    const { name, email, password, type } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(400).json({ error: "Email já está em uso." });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma.user.create({
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
});
//Login de Usuário
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
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
    const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
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
});
// Cria veiculo
app.post("/vehicles", async (req, res) => {
    const { model, plateNumber } = req.body;
    const vehicle = await prisma.vehicle.create({ data: { model, plateNumber } });
    res.json(vehicle);
});
// Cria material
app.post("/materials", async (req, res) => {
    const { name, description } = req.body;
    const material = await prisma.material.create({
        data: { name, description },
    });
    res.json(material);
});
// Atribuir veiculo a user
app.post("/assign-vehicle", auth_1.authenticate, (0, checkPermission_1.checkPermission)("ASSIGN_VEHICLE"), async (req, res) => {
    const { userId, vehicleId } = req.body;
    const alreadyAssigned = await prisma.assignedVehicle.findFirst({
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
    const vehicleAssignment = await prisma.assignedVehicle.create({
        data: { userId, vehicleId },
    });
    res.json(vehicleAssignment);
});
// Desatribuir veiculo a user
app.patch("/unassigned-vehicle/:assignmentId", auth_1.authenticate, async (req, res) => {
    const { assignmentId } = req.params;
    const updated = await prisma.assignedVehicle.update({
        where: { id: assignmentId },
        data: { unassignedAt: new Date() },
    });
    res.json(updated);
});
// Atribuir material ao user
app.post("/assign-material", async (req, res) => {
    const { userId, materialId } = req.body;
    const materialAssignment = await prisma.assignedMaterial.create({
        data: { userId, materialId },
    });
    res.json(materialAssignment);
});
// Desatribuir material ao user
app.patch("/unassign-material/:assignmentId", async (req, res) => {
    const { assignmentId } = req.params;
    const updated = await prisma.assignedMaterial.update({
        where: { id: assignmentId },
        data: { unassignedAt: new Date() },
    });
    res.json(updated);
});
app.get("/vehicle-history/:userId", async (req, res) => {
    const { userId } = req.params;
    const history = await prisma.assignedVehicle.findMany({
        where: { userId },
        include: { vehicle: true },
    });
    res.json(history);
});
app.post("/init-permissions", async (req, res) => {
    const types = [
        client_1.PermissionType.ASSIGN_VEHICLE,
        client_1.PermissionType.ASSIGN_MATERIAL,
        client_1.PermissionType.UNASSIGN_VEHICLE,
        client_1.PermissionType.UNASSIGN_MATERIAL,
    ];
    for (const type of types) {
        await prisma.permission.upsert({
            where: { type },
            update: {},
            create: { type },
        });
    }
    res.json({ ok: true });
});
app.post("/grant-permission", async (req, res) => {
    const { userId, permissionType } = req.body;
    const permission = await prisma.permission.findUnique({
        where: { type: permissionType },
    });
    if (!permission)
        return res.status(400).json({ error: "Permissão inválida" });
    const alreadyHas = await prisma.userPermission.findFirst({
        where: { userId, permissionId: permission.id },
    });
    if (alreadyHas)
        return res.status(400).json({ error: "Já tem essa permissão" });
    await prisma.userPermission.create({
        data: { userId, permissionId: permission.id },
    });
    res.json({ success: true });
});
app.post("/revoke-permission", async (req, res) => {
    const { userId, permissionType } = req.body;
    const permission = await prisma.permission.findUnique({
        where: { type: permissionType },
    });
    if (!permission)
        return res.status(400).json({ error: "Permissão inválida" });
    await prisma.userPermission.deleteMany({
        where: { userId, permissionId: permission.id },
    });
    res.json({ success: true });
});
app.listen(5000, () => {
    console.log(`🚚 Fleet API rodando em http://localhost:${5000}`);
});
