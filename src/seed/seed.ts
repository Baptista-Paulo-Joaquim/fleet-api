import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("admin@2025", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@informamz.gov.mz" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@informamz.gov.mz",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin ready:", admin.email);

  const owners = [
    "João Manuel",
    "Ana Maria",
    "Carlos Alberto",
    "Paulo Ernesto",
    "Helena Joaquim",
    "Nelson Armando",
    "Fátima Ismael",
    "Abdul Karim",
    "Mateus Tomás",
    "Rosa Domingos",
    "Amélia Macuácua",
    "Salvador Mucavele",
    "Inocêncio Nhantumbo",
    "Teresa Cossa",
    "Ernesto Mabote",
    "Lucinda Mussa",
    "Filipe Matola",
    "Sandra Mavume",
    "Alberto Nhancale",
    "Celina Chissano",
  ];

  const provinces = [
    "Maputo",
    "Maputo Cidade",
    "Gaza",
    "Inhambane",
    "Sofala",
    "Manica",
    "Tete",
    "Zambézia",
    "Nampula",
    "Niassa",
    "Cabo Delgado",
  ];

  const documentTypes = [
    "Bilhete de Identidade",
    "Cartão de Eleitor",
    "Carta de Condução",
    "DIRE",
  ];

  const documents = owners.map((name, index) => ({
    ownerName: name,
    documentType: documentTypes[index % documentTypes.length],
    documentId: `MZ-${100000 + index}`,
    province: provinces[index % provinces.length],
    country: "Moçambique",
    pickupLocation: "Comando da Polícia",
    expirationDate: new Date(
      new Date().setFullYear(new Date().getFullYear() + 5)
    ),
    foundLocation: "Terminal Rodoviário",
    belongings: "Capa plástica",
    registeredById: admin.id,
  }));

  await prisma.document.createMany({
    data: documents,
  });

  console.log("✅ 20 documentos criados com sucesso");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
