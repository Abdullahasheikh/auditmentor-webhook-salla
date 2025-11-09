// api/salla.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    const event = body?.event;
    const data = body?.data;

    // نتحقق أن الحدث من النوع الصحيح
    if (event !== "invoice.created" || !data?.customer || !data?.items) {
      return res.status(400).json({ error: "Invalid payload format" });
    }

    // اسم المنتج المستهدف
    const targetProduct = "بنك الأسئلة شهادة المدقق الداخلي الجزء الأول";
    const hasTargetProduct = data.items.some(
      (item) => item.name === targetProduct
    );

    if (!hasTargetProduct) {
      return res.status(200).json({ status: "ignored", reason: "Not target product" });
    }

    // بيانات العميل
    const customer = data.customer;

    // بناء البيانات للإرسال إلى Learning-Go
    const payload = {
      clientName: "GUHAYNA",
      operations: ["ADD_STUDENT", "SUBSCRIBE"],
      userEmail: customer.email,
      userFirstName: customer.first_name,
      userLastName: customer.last_name,
      userContactNumber: customer.mobile.toString(),
      userCountryISOCode: "SA",
      userImgUrl: customer.avatar,
      userGender: customer.gender === "male" ? "Male" : "Female",
      sendResetLink: true // طلب إرسال رابط لتعيين كلمة المرور
    };

    // إرسال الطلب إلى Learning-Go
    const response = await fetch("https://learning-go.dev/api/client/operation", {
      method: "POST",
      headers: {
        "Authorization": process.env.LEARNING_GO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    res.status(200).json({
      status: response.ok ? "success" : "error",
      learningGoStatus: response.status,
      learningGoResponse: text
    });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ error: err.message });
  }
}

