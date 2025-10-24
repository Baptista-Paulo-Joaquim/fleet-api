import express, { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import cors from "cors";
import { PermissionType } from "@prisma/client";
import { authenticate } from "./middleware/auth";
import prismaMiddleware from "./utils/prisma";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
//import { checkPermission } from "./middleware/checkPermission";

const app: Express = express();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Minha API",
      version: "1.0.0",
      description: "Documentação da API do sistema",
    },
  },
  apis: ["./src/**/*.ts"],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const SECRET = "mySecret@2025";
app.use(express.json());
app.use(morgan("dev"));

/**
 * Generates a PDF report for the closing of a cash register.
 *
 * @route GET /reports/closing/:id/pdf
 * @param {Request} req - Express request object containing the cash register ID in params.
 * @param {Response} res - Express response used to stream the PDF file.
 * @param {NextFunction} next - Express error handler function.
 *
 * @returns {void} Streams the generated PDF to the client.
 * @throws {AppError} If no report is found or PDF generation fails.
 */

app.get("/", (req: Request, res: Response) => {
  res.send("API rodando na VPS 🚀");
});

/**
 * @openapi
 * /signup:
 *   post:
 *     summary: Cria um novo usuário com senha criptografada
 *     tags:
 *       - Usuários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: João
 *               email:
 *                 type: string
 *                 example: joao@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               type:
 *                 type: string
 *                 example: STAFF
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Email já em uso
 */

// Criar usuário com senha criptografada
app.post("/signup", async (req: Request, res: Response) => {
  const { name, email, password, type } = req.body;

  const existing = await prismaMiddleware.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: "Email já está em uso." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prismaMiddleware.user.create({
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

  const user = await prismaMiddleware.user.findUnique({
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

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Senha incorreta" });
  }

  const token = jwt.sign({ userId: user.id, type: user.type }, SECRET, {
    expiresIn: "1d",
  });

  const permissions = user.permissions.map((p: any) => p.permission.type);

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
app.post("/vehicles", async (req: Request, res: Response) => {
  const { model, plateNumber } = req.body;
  const vehicle = await prismaMiddleware.vehicle.create({
    data: { model, plateNumber },
  });
  res.json(vehicle);
});

/**
 * @openapi
 * /vehicles/:id:
 *   delete:
 *     summary: Elimina um veículo
 *     tags:
 *       - Veículos
 *     responses:
 *       200:
 *         description: Veículo apagado com sucesso
 */

// Exclui veiculo
app.delete("/vehicles/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const vehicle = await prismaMiddleware.vehicle.delete({
    where: { id },
  });
  res.json(vehicle);
});

/**
 * @openapi
 * /vehicles:
 *   get:
 *     summary: Lista todos os veículos
 *     tags:
 *       - Veículos
 *     responses:
 *       200:
 *         description: Lista de veículos retornada com sucesso
 */

// FindMany Vehicles
app.get("/vehicles", async (req: Request, res: Response) => {
  const vehicles = await prismaMiddleware.vehicle.findMany();
  res.json(vehicles);
});

// FindMany Vehicles Without filters

app.get("/vehicles/all", async (req: Request, res: Response) => {
  const vehicles = await prismaMiddleware.vehicle.findMany(); // Prisma original
  res.json(vehicles);
});

// Obtem materiais
app.get("/materials", async (req: Request, res: Response) => {
  const materials = await prismaMiddleware.material.findMany();
  res.json(materials);
});

// Cria material
app.post("/materials", async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const material = await prismaMiddleware.material.create({
    data: { name, description },
  });
  res.json(material);
});

// Atribuir veiculo a user
app.post(
  "/assign-vehicle",
  authenticate,
  // checkPermission("ASSIGN_VEHICLE"),
  async (req: Request, res: Response) => {
    const { userId, vehicleId } = req.body;

    const alreadyAssigned = await prismaMiddleware.assignedVehicle.findFirst({
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

    const vehicleAssignment = await prismaMiddleware.assignedVehicle.create({
      data: { userId, vehicleId },
    });
    res.json(vehicleAssignment);
  }
);

// Desatribuir veiculo a user
app.patch(
  "/unassigned-vehicle/:assignmentId",
  authenticate,
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params;

    const updated = await prismaMiddleware.assignedVehicle.update({
      where: { id: assignmentId },
      data: { unassignedAt: new Date() },
    });

    res.json(updated);
  }
);

// Atribuir material ao user
app.post("/assign-material", async (req: Request, res: Response) => {
  const { userId, materialId } = req.body;
  const materialAssignment = await prismaMiddleware.assignedMaterial.create({
    data: { userId, materialId },
  });
  res.json(materialAssignment);
});

// Desatribuir material ao user
app.patch("/unassign-material/:assignmentId", async (req, res) => {
  const { assignmentId } = req.params;

  const updated = await prismaMiddleware.assignedMaterial.update({
    where: { id: assignmentId },
    data: { unassignedAt: new Date() },
  });

  res.json(updated);
});

app.get("/vehicle-history/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const history = await prismaMiddleware.assignedVehicle.findMany({
    where: { userId },
    include: { vehicle: true },
  });
  res.json(history);
});

app.post("/init-permissions", async (req, res) => {
  const types: PermissionType[] = [
    PermissionType.ASSIGN_VEHICLE,
    PermissionType.ASSIGN_MATERIAL,
    PermissionType.UNASSIGN_VEHICLE,
    PermissionType.UNASSIGN_MATERIAL,
  ];

  for (const type of types) {
    await prismaMiddleware.permission.upsert({
      where: { type },
      update: {},
      create: { type },
    });
  }

  res.json({ ok: true });
});

app.post("/grant-permission", async (req, res) => {
  const { userId, permissionType } = req.body;

  const permission = await prismaMiddleware.permission.findUnique({
    where: { type: permissionType },
  });

  if (!permission) return res.status(400).json({ error: "Permissão inválida" });

  const alreadyHas = await prismaMiddleware.userPermission.findFirst({
    where: { userId, permissionId: permission.id },
  });

  if (alreadyHas)
    return res.status(400).json({ error: "Já tem essa permissão" });

  await prismaMiddleware.userPermission.create({
    data: { userId, permissionId: permission.id },
  });

  res.json({ success: true });
});

app.post("/revoke-permission", async (req, res) => {
  const { userId, permissionType } = req.body;

  const permission = await prismaMiddleware.permission.findUnique({
    where: { type: permissionType },
  });

  if (!permission) return res.status(400).json({ error: "Permissão inválida" });

  await prismaMiddleware.userPermission.deleteMany({
    where: { userId, permissionId: permission.id },
  });

  res.json({ success: true });
});

app.listen(5000, () => {
  console.log(`🚚 Fleet API rodando em http://localhost:${5000}`);
});

export default app;
