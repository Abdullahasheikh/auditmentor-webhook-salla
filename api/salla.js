// api/salla.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    const event = body?.event;
    const data = body?.data;

    console.log("Webhook received:", event);

    // التحقق من صحة الـ payload
    if (!event || !data || !data.customer || !Array.isArray(data.items)) {
      console.warn("Invalid payload format:", body);
      return res.status(400).json({ error: "Invalid payload format" });
    }

    // اسم المنتج المستهدف
    const targetProduct = "بنك الأسئلة شهادة المدقق الداخلي الجزء الأول";

    const hasTargetProduct = data.items.some(item => 
      item.name && item.name.includes(targetProduct)
    );

    if (!hasTargetProduct) {
      console.log("Product not target:", data.items.map(i => i.name));
      return res.status(200).json({ status: "ignored", reason: "Not target product" });
    }

    // بيانات العميل
    const customer = data.customer;

    // توليد كلمة مرور عشوائية إذا لم تكن موجودة
    const randomPassword = Math.random().toString(36).slice(-8);

    const userData = {
      clientName: "GUHAYNA",
      operations: ["ADD_STUDENT", "SUBSCRIBE"],
      userEmail: customer.email || "",
      userFirstName: customer.first_name || "",
      userLastName: customer.last_name || "",
      userContactNumber: customer.mobile?.toString() || "",
      userBirthDate: customer.birth_date || "",
      userGender: customer.gender === "male" ? "Male" : customer.gender === "female" ? "Female" : "Other",
      userImgUrl: customer.avatar || "",
      userCountryISOCode: "SA",
      userPassword: randomPassword
    };

    console.log("Prepared user data:", userData);

    // حفظ البيانات في ملف JSON مؤقت
    const filePath = path.join(process.cwd(), "webhook_data.json");

    let existingData = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath);
      existingData = JSON.parse(raw);
    }

    existingData.push(userData);
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    console.log(`User data saved. Total records: ${existingData.length}`);

    return res.status(200).json({
      status: "success",
      message: "Webhook processed and data stored locally",
      user: userData
    });

  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
