// api/salla.js
import { NextApiRequest, NextApiResponse } from "next";

// مصفوفة لتخزين البيانات مؤقتًا في الذاكرة
let memoryData = [];

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const body = req.body;
      const event = body?.event;
      const data = body?.data;

      console.log("Webhook received:", event);

      if (!event || !data || !data.customer || !Array.isArray(data.items)) {
        return res.status(400).json({ error: "Invalid payload format" });
      }

      const targetProduct = "بنك الأسئلة شهادة المدقق الداخلي الجزء الأول";

      const hasTargetProduct = data.items.some(
        (item) => item.name && item.name.includes(targetProduct)
      );

      if (!hasTargetProduct) {
        console.log("Product not target:", data.items.map((i) => i.name));
        return res
          .status(200)
          .json({ status: "ignored", reason: "Not target product" });
      }

      const customer = data.customer;

      // توليد كلمة مرور عشوائية
      const randomPassword = Math.random().toString(36).slice(-8);

      const userData = {
        clientName: "GUHAYNA",
        operations: ["ADD_STUDENT", "SUBSCRIBE"],
        userEmail: customer.email || "",
        userFirstName: customer.first_name || "",
        userLastName: customer.last_name || "",
        userContactNumber: customer.mobile?.toString() || "",
        userBirthDate: customer.birth_date || "",
        userGender:
          customer.gender === "male"
            ? "Male"
            : customer.gender === "female"
            ? "Female"
            : "Other",
        userImgUrl: customer.avatar || "",
        userCountryISOCode: "SA",
        userPassword: randomPassword,
        timestamp: new Date().toISOString(),
      };

      // إضافة البيانات إلى الذاكرة
      memoryData.push(userData);

      // الاحتفاظ فقط بآخر 50 طلبًا لتجنب استهلاك الذاكرة
      if (memoryData.length > 50) memoryData.shift();

      console.log(`User data stored. Total records: ${memoryData.length}`);

      return res.status(200).json({
        status: "success",
        message: "Webhook processed and data stored in memory",
        user: userData,
      });
    } catch (err) {
      console.error("Webhook Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET لعرض آخر 10 طلبات
  if (req.method === "GET") {
    const last10 = memoryData.slice(-10).reverse();
    return res.status(200).json({ last10 });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
