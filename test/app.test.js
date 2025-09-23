jest.mock("../src/services/GmailEmailService", () => ({
  sendNotificationEmail: jest.fn().mockResolvedValue(undefined)
}));
// tests/app.test.js
const request = require("supertest");
const app = require("../src/index");
const axios = require("axios");

jest.mock("knex", () => {
  let mockData = [
    {
      id_complaint: 1,
      public_entity: "Alcaldía Municipal",
      description: "Problema con alumbrado público",
      status: 1,
      complaint_status: "abierta",
      created_at: new Date('2023-09-15T10:30:00Z'),
      updated_at: new Date('2023-09-15T10:30:00Z')
    },
    {
      id_complaint: 2,
      public_entity: "Hospital Regional",
      description: "Demora en atención médica",
      status: 1,
      complaint_status: "en_revision",
      created_at: new Date('2023-09-14T14:20:00Z'),
      updated_at: new Date('2023-09-14T14:20:00Z')
    }
  ];

  let mockCommentsData = [
    {
      id_comment: 1,
      id_complaint: 1,
      comment_text: "Este es un comentario anónimo de prueba",
      created_at: new Date('2023-09-16T08:15:00Z'),
      status: 1
    },
    {
      id_comment: 2,
      id_complaint: 1,
      comment_text: "Otro comentario anónimo para la misma queja",
      created_at: new Date('2023-09-17T12:45:00Z'),
      status: 1
    }
  ];

  let currentTable = 'COMPLAINTS';
  let chainedFilters = [];

  const mockClient = {
    select: jest.fn((fields) => {
      mockClient._selectedFields = fields;
      return mockClient;
    }),
    from: jest.fn((table) => {
      currentTable = table;
      if (table === 'PUBLIC_ENTITYS') {
        return Promise.resolve([{ id: 1, name: "Entity 1" }]);
      }
      return mockClient;
    }),
    insert: jest.fn((data) => {
      if (currentTable === 'ANONYMOUS_COMMENTS') {
        const newComment = {
          id_comment: mockCommentsData.length + 1,
          ...data,
          created_at: new Date(),
          status: 1
        };
        mockCommentsData.push(newComment);
      }
      return Promise.resolve([1]);
    }),
    update: jest.fn().mockResolvedValue(1),
    join: jest.fn(() => mockClient),
    orderBy: jest.fn(() => mockClient),
    first: jest.fn(() => {
      const data = currentTable === 'ANONYMOUS_COMMENTS' ? mockCommentsData : mockData;
      let result = null;
      
      if (chainedFilters.length > 0) {
        let filteredData = data;
        chainedFilters.forEach(filter => {
          filteredData = filteredData.filter(filter);
        });
        result = filteredData.length > 0 ? filteredData[0] : null;
      } else {
        result = data.length > 0 ? data[0] : null;
      }
      
      // Reset filters after use
      chainedFilters = [];
      
      return Promise.resolve(result);
    }),
    where: jest.fn((field, value) => {
      if (field === 'c.status' || field === 'status') {
        chainedFilters.push((item) => item.status === value);
      } else if (field === 'id_complaint') {
        chainedFilters.push((item) => item.id_complaint === value);
      } else if (field === 'c.id_complaint') {
        chainedFilters.push((item) => item.id_complaint === value);
      }
      return mockClient;
    }),
    then: jest.fn((callback) => {
      let data;
      if (currentTable === 'ANONYMOUS_COMMENTS') {
        data = mockCommentsData;
      } else {
        data = mockData;
      }
      
      if (chainedFilters.length > 0) {
        chainedFilters.forEach(filter => {
          data = data.filter(filter);
        });
      }
      
      callback(data);
      chainedFilters = [];
      currentTable = 'COMPLAINTS';
      return mockClient;
    }),
    catch: jest.fn(() => mockClient),
    __setMockData: (data) => {
      mockData = data;
    },
    __setMockCommentsData: (data) => {
      mockCommentsData = data;
    }
  };

  const knexFn = jest.fn((tableName) => {
    let instanceCurrentTable = tableName || 'COMPLAINTS';
    const instanceChainedFilters = [];

    const instanceClient = {
      select: jest.fn((fields) => {
        instanceClient._selectedFields = fields;
        return instanceClient;
      }),
      from: jest.fn((table) => {
        instanceCurrentTable = table;
        if (table === 'PUBLIC_ENTITYS') {
          return Promise.resolve([{ id: 1, name: "Entity 1" }]);
        }
        return instanceClient;
      }),
      insert: jest.fn((data) => {
        if (instanceCurrentTable === 'ANONYMOUS_COMMENTS') {
          const newComment = {
            id_comment: mockCommentsData.length + 1,
            ...data,
            created_at: new Date(),
            status: 1
          };
          mockCommentsData.push(newComment);
        }
        return Promise.resolve([1]);
      }),
      update: jest.fn().mockResolvedValue(1),
      join: jest.fn(() => instanceClient),
      orderBy: jest.fn(() => instanceClient),
      first: jest.fn(() => {
        const data = instanceCurrentTable === 'ANONYMOUS_COMMENTS' ? mockCommentsData : mockData;
        let result = null;
        
        if (instanceChainedFilters.length > 0) {
          let filteredData = data;
          instanceChainedFilters.forEach(filter => {
            filteredData = filteredData.filter(filter);
          });
          result = filteredData.length > 0 ? filteredData[0] : null;
        } else {
          result = data.length > 0 ? data[0] : null;
        }
        
        return Promise.resolve(result);
      }),
      where: jest.fn((field, value) => {
        if (field === 'c.status' || field === 'status') {
          instanceChainedFilters.push((item) => item.status === value);
        } else if (field === 'id_complaint') {
          instanceChainedFilters.push((item) => item.id_complaint === Number(value));
        } else if (field === 'c.id_complaint') {
          instanceChainedFilters.push((item) => item.id_complaint === Number(value));
        }
        return instanceClient;
      }),
      then: jest.fn((callback) => {
        let data;
        if (instanceCurrentTable === 'ANONYMOUS_COMMENTS') {
          data = mockCommentsData;
        } else {
          data = mockData;
        }
        
        if (instanceChainedFilters.length > 0) {
          instanceChainedFilters.forEach(filter => {
            data = data.filter(filter);
          });
        }
        
        callback(data);
        return instanceClient;
      }),
      catch: jest.fn(() => instanceClient),
    };

    return instanceClient;
  });
  
  // Añadir métodos directos al knexFn para compatibilidad
  knexFn.select = jest.fn((fields) => {
    const client = knexFn();
    return client.select(fields);
  });
  
  knexFn.from = jest.fn((table) => {
    const client = knexFn();
    return client.from(table);
  });
  
  knexFn.insert = jest.fn((data) => {
    const client = knexFn();
    return client.insert(data);
  });
  
  knexFn.update = jest.fn((data) => {
    const client = knexFn();
    return client.update(data);
  });
  
  knexFn.join = jest.fn((table, on1, on2) => {
    const client = knexFn();
    return client.join(table, on1, on2);
  });
  
  knexFn.orderBy = jest.fn((field, direction) => {
    const client = knexFn();
    return client.orderBy(field, direction);
  });
  
  knexFn.where = jest.fn((field, value) => {
    const client = knexFn();
    return client.where(field, value);
  });
  
  knexFn.first = jest.fn(() => {
    const client = knexFn();
    return client.first();
  });

  // Función específica para manejar las llamadas knex()
  knexFn.__setMockData = (data) => {
    mockData = data;
  };

  knexFn.__setMockCommentsData = (data) => {
    mockCommentsData = data;
  };

  return () => knexFn;
});

jest.mock("axios");
const mockedAxios = axios;

describe("App Endpoints", () => {
  const knex = require("knex")();
  
  beforeEach(() => {
    jest.clearAllMocks();
    knex.__setMockData([
      {
        id_complaint: 1,
        public_entity: "Alcaldía Municipal",
        description: "Problema con alumbrado público",
        status: 1,
        complaint_status: "abierta",
        created_at: new Date('2023-09-15T10:30:00Z'),
        updated_at: new Date('2023-09-15T10:30:00Z')
      },
      {
        id_complaint: 2,
        public_entity: "Hospital Regional",
        description: "Demora en atención médica",
        status: 1,
        complaint_status: "en_revision",
        created_at: new Date('2023-09-14T14:20:00Z'),
        updated_at: new Date('2023-09-14T14:20:00Z')
      }
    ]);
    
    knex.__setMockCommentsData([
      {
        id_comment: 1,
        id_complaint: 1,
        comment_text: "Este es un comentario anónimo de prueba",
        created_at: new Date('2023-09-16T08:15:00Z'),
        status: 1
      }
    ]);
  });

  test("GET / must render the home view with entities", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Entity 1");
  });

  test("POST /complaints/file without data should return error in the view", async () => {
    const res = await request(app).post("/complaints/file").send({});
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Entity and description are required");
  });

  test("POST /complaints/file with valid data should log and return success", async () => {
    const res = await request(app)
      .post("/complaints/file")
      .send({ entity: 1, description: "Test complaint" });
    expect(res.text).toContain("Complaint successfully registered");
  });

  test("POST /complaints/file with non-numeric entity should handle the error", async () => {
    const res = await request(app)
      .post("/complaints/file")
      .send({ entity: "abc", description: "Bad entity" });
    expect(res.text).toContain("Error");
  });

  test("GET / responds with HTML (rendered view)", async () => {
    const res = await request(app).get("/");
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  test("GET /complaints/list should render complaints list view", async () => {
    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Alcaldía Municipal");
    expect(res.text).toContain("Hospital Regional");
  });

  test("POST /verify-captcha without token should return error", async () => {
    const res = await request(app)
      .post("/verify-captcha")
      .send({});
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: 'Token no enviado'
    });
  });

  test("POST /verify-captcha with valid token should succeed", async () => {
    mockedAxios.post.mockResolvedValue({
      data: { success: true }
    });

    const res = await request(app)
      .post("/verify-captcha")
      .send({ token: "valid_token_123" });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Verificación exitosa'
    });
  });

  test("POST /verify-captcha with failed verification", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        success: false,
        'error-codes': ['invalid-input-response']
      }
    });

    const res = await request(app)
      .post("/verify-captcha")
      .send({ token: "invalid_token" });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: false,
      error: 'Verificación fallida',
      'error-codes': ['invalid-input-response']
    });
  });

  test("POST /verify-captcha should handle network errors", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Network error"));

    const res = await request(app)
      .post("/verify-captcha")
      .send({ token: "some_token" });
    
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: 'Error interno en verify-captcha'
    });
  });

  test("should handle empty complaints list", async () => {
    knex.__setMockData([]);
    
    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Consultar Quejas");

    expect(res.text).not.toContain("Alcaldía Municipal");
    expect(res.text).not.toContain("Hospital Regional");
  });

  test("should handle very long description in complaints", async () => {
    const longDescription = "a".repeat(1000);
    
    knex.__setMockData([{
      id_complaint: 1,
      public_entity: "Test Entity",
      description: longDescription,
      status: 1,
      complaint_status: "abierta",
      created_at: new Date('2023-09-15T10:30:00Z'),
      updated_at: new Date('2023-09-15T10:30:00Z')
    }]);
    
    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Test Entity");
    expect(res.text).toContain(longDescription.substring(0, 500)); 
  });

  test("should handle database errors gracefully", async () => {
    const originalThen = knex.then;
    knex.then = jest.fn((successCallback, errorCallback) => {
      if (errorCallback) {
        errorCallback(new Error("Database connection failed"));
      }
      return knex;
    });

    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    
    knex.then = originalThen;
  });

  test("POST /complaints/update-status without data should return error", async () => {
    const res = await request(app)
      .post("/complaints/update-status")
      .send({});
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Datos incompletos: se requiere ID de queja, nuevo estado y contraseña'
    });
  });

  test("POST /complaints/update-status with invalid status should return error", async () => {
    const res = await request(app)
      .post("/complaints/update-status")
      .send({
        id_complaint: 1,
        complaint_status: "invalid_status",
        password: "admin123"
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Estado no válido. Los estados permitidos son: abierta, en_revision, cerrada'
    });
  });

  test("POST /complaints/update-status with wrong password should return error", async () => {
    const res = await request(app)
      .post("/complaints/update-status")
      .send({
        id_complaint: 1,
        complaint_status: "cerrada",
        password: "wrong_password"
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: 'Contraseña incorrecta'
    });
  });

  test("should display complaint status badges correctly", async () => {
    knex.__setMockData([
      {
        id_complaint: 1,
        public_entity: "Alcaldía Municipal",
        description: "Problema con alumbrado público",
        status: 1,
        complaint_status: "abierta",
        created_at: new Date('2023-09-15T10:30:00Z')
      },
      {
        id_complaint: 2,
        public_entity: "Hospital Regional",
        description: "Demora en atención médica",
        status: 1,
        complaint_status: "cerrada",
        created_at: new Date('2023-09-14T14:20:00Z')
      }
    ]);

    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Abierta");
    expect(res.text).toContain("Cerrada");
    expect(res.text).toContain("badge bg-warning");
    expect(res.text).toContain("badge bg-success");
  });

  // Tests para comentarios anónimos
  test("GET /complaints/:id/comments should return comments for a valid complaint", async () => {
    const res = await request(app).get("/complaints/1/comments");
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments).toBeDefined();
    expect(Array.isArray(res.body.comments)).toBe(true);
  });

  test("GET /complaints/:id/comments with invalid ID should return error", async () => {
    const res = await request(app).get("/complaints/invalid/comments");
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("ID de queja inválido");
  });

  test("POST /complaints/comments should add a new comment successfully", async () => {
    const newComment = {
      id_complaint: 1,
      comment_text: "Este es un nuevo comentario anónimo de prueba"
    };

    const res = await request(app)
      .post("/complaints/comments")
      .send(newComment);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Comentario agregado exitosamente");
  });

  test("POST /complaints/comments with short comment should return error", async () => {
    const shortComment = {
      id_complaint: 1,
      comment_text: "Corto"
    };

    const res = await request(app)
      .post("/complaints/comments")
      .send(shortComment);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("El comentario debe tener al menos 10 caracteres");
  });

  test("POST /complaints/comments without required data should return error", async () => {
    const res = await request(app)
      .post("/complaints/comments")
      .send({});
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("ID de queja y texto del comentario son requeridos");
  });

  test("GET /complaints/:id/details should return complaint with comments", async () => {
    const res = await request(app).get("/complaints/1/details");
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint).toBeDefined();
    expect(res.body.comments).toBeDefined();
    expect(Array.isArray(res.body.comments)).toBe(true);
  });

  test("GET /complaints/:id/details with invalid ID should return error", async () => {
    const res = await request(app).get("/complaints/999/details");
    
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Queja no encontrada");
  });

  test("should display creation dates in complaints list", async () => {
    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Fecha de Creación");
    // Verificar que las fechas se muestran formateadas
    expect(res.text).toMatch(/\d{1,2}\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/);
  });

  test("complaints should be ordered by creation date descending", async () => {
    knex.__setMockData([
      {
        id_complaint: 1,
        public_entity: "Entidad A",
        description: "Descripción A",
        status: 1,
        complaint_status: "abierta",
        created_at: new Date('2023-09-10T10:00:00Z')
      },
      {
        id_complaint: 2,
        public_entity: "Entidad B",
        description: "Descripción B",
        status: 1,
        complaint_status: "abierta",
        created_at: new Date('2023-09-15T10:00:00Z')
      }
    ]);

    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    // Verificar que las fechas aparecen en el HTML
    expect(res.text).toContain("Entidad A");
    expect(res.text).toContain("Entidad B");
  });
});