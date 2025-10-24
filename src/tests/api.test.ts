import request from "supertest";
import app from "../index";

describe("API Tests", () => {
  describe("GET /materials", () => {
    it("deve retornar materiais 200", async () => {
      const response = await request(app).get("/materials");
      expect(response.body);
      expect(response.status).toBe(200);
      console.log(response.ok);
    });
  });

  describe("POST  /login", () => {
    it("deve fazer login", async () => {
      const response = await request(app)
        .post("/login")
        .send({ email: "baptistajoaquim0@gmail.com", password: "1234" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
    });

    it("login deve falhar", async () => {
      const response = await request(app)
        .post("/login")
        .send({ email: "baptistajoaquim0@gmail.com", password: "errado" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Senha incorreta");
    });
  });
});
