import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v1/external";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const email = Deno.env.get("SHIPROCKET_EMAIL");
    const password = Deno.env.get("SHIPROCKET_PASSWORD");
    const pickupLocation = Deno.env.get("SHIPROCKET_PICKUP_LOCATION") || "warehouse";

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: "Shiprocket credentials (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD) are not set in Supabase Vault / Edge Function secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Authenticate with Shiprocket API to obtain Bearer token
    console.log(`Authenticating with Shiprocket as ${email}...`);
    const authRes = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const authData = await authRes.json();
    if (!authRes.ok || !authData.token) {
      console.error("Shiprocket Auth Error:", authData);
      return new Response(
        JSON.stringify({
          error: `Shiprocket authentication failed: ${authData.message || JSON.stringify(authData)}`,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authData.token;

    if (payload.action === 'get_pickup_locations') {
      const pickupRes = await fetch(`${SHIPROCKET_API_URL}/settings/company/pickup`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pickupData = await pickupRes.json();
      return new Response(JSON.stringify(pickupData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (payload.action === 'track_awb') {
      const awb = payload.awb_code;
      if (!awb) {
        return new Response(JSON.stringify({ error: "Missing awb_code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const trackRes = await fetch(`${SHIPROCKET_API_URL}/courier/track/awb/${encodeURIComponent(awb)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const trackData = await trackRes.json();
      return new Response(JSON.stringify(trackData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (payload.action === 'register_creator_pickup') {
      const pickupNickname = String(payload.pickup_nickname || `STUDIO-${String(payload.user_id || Date.now()).slice(0, 15)}`).trim();
      const rawPhone = String(payload.phone || "9999999999").replace(/\D/g, "");
      const formattedPhone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone.padStart(10, "9");
      const formattedPincode = String(payload.pincode || "400001").replace(/\D/g, "").slice(0, 6);

      const addPickupBody = {
        pickup_location: pickupNickname,
        name: payload.name || "Camqrew Creator",
        email: payload.email || "creator@camqrew.in",
        phone: formattedPhone,
        address: payload.address || "Studio Address",
        address_2: payload.address_2 || "",
        city: payload.city || "Mumbai",
        state: payload.state || "Maharashtra",
        country: "India",
        pin_code: formattedPincode,
      };

      console.log("Registering creator pickup address with Shiprocket:", addPickupBody.pickup_location);
      const addRes = await fetch(`${SHIPROCKET_API_URL}/settings/company/addpickup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addPickupBody),
      });

      const addData = await addRes.json();
      console.log("Shiprocket add pickup response:", addData);

      if (!addRes.ok && !addData.success && !JSON.stringify(addData).toLowerCase().includes("already exist")) {
        return new Response(JSON.stringify({ error: addData.message || JSON.stringify(addData) }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        pickup_location: pickupNickname,
        details: addPickupBody
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (payload.action === 'generate_label') {
      const shipmentId = payload.shipment_id;
      if (!shipmentId) {
        return new Response(JSON.stringify({ error: "Missing shipment_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`Generating shipping label for shipment ${shipmentId}...`);
      const labelRes = await fetch(`${SHIPROCKET_API_URL}/courier/generate/label`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipment_id: Array.isArray(shipmentId) ? shipmentId : [Number(shipmentId) || shipmentId]
        }),
      });

      const labelData = await labelRes.json();
      console.log("Shiprocket label response:", labelData);

      const labelUrl = labelData.label_url || labelData.label_created;
      return new Response(JSON.stringify({
        success: true,
        label_url: labelUrl,
        raw: labelData
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Prepare Order Items
    const rawItems = Array.isArray(payload.order_items) && payload.order_items.length > 0
      ? payload.order_items
      : [
          {
            name: "Camqrew Gear Package",
            sku: `CAM-${payload.order_id || Date.now()}`,
            units: 1,
            selling_price: String(payload.sub_total || 500),
          },
        ];

    const orderItems = rawItems.map((item: any, idx: number) => ({
      name: item.name || `Gear Item ${idx + 1}`,
      sku: item.sku || `SKU-${idx + 1}-${Date.now()}`,
      units: Number(item.units || item.quantity || 1),
      selling_price: String(item.selling_price || item.price || payload.sub_total || 500),
      discount: item.discount ? String(item.discount) : "0",
      tax: item.tax ? String(item.tax) : "0",
    }));

    // Clean Phone number (remove +91, dashes, spaces; Shiprocket expects 10 digits)
    const rawPhone = String(payload.billing_phone || "9999999999").replace(/\D/g, "");
    const formattedPhone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone.padStart(10, "9");

    // Clean Pincode (6 digits)
    const formattedPincode = String(payload.billing_pincode || "400001").replace(/\D/g, "").slice(0, 6);

    // Format Date: YYYY-MM-DD HH:mm
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const custName = payload.billing_customer_name || "Customer";
    const custLastName = payload.billing_last_name || "";
    const addr1 = payload.billing_address || "Studio Location";
    const addr2 = payload.billing_address_2 || "";
    const city = payload.billing_city || "Mumbai";
    const state = payload.billing_state || "Maharashtra";
    const country = payload.billing_country || "India";
    const emailAddr = payload.billing_email || "team@camqrew.in";

    // 3. Create Ad-hoc Order in Shiprocket with both billing and shipping fields
    const orderBody = {
      order_id: String(payload.order_id),
      order_date: formattedDate,
      pickup_location: payload.pickup_location || pickupLocation,
      channel_id: "",
      comment: "Camqrew Gear Shipment",
      billing_customer_name: custName,
      billing_last_name: custLastName,
      billing_address: addr1,
      billing_address_2: addr2,
      billing_city: city,
      billing_pincode: formattedPincode,
      billing_state: state,
      billing_country: country,
      billing_email: emailAddr,
      billing_phone: formattedPhone,
      shipping_is_billing: true,
      shipping_customer_name: custName,
      shipping_last_name: custLastName,
      shipping_address: addr1,
      shipping_address_2: addr2,
      shipping_city: city,
      shipping_pincode: formattedPincode,
      shipping_country: country,
      shipping_state: state,
      shipping_email: emailAddr,
      shipping_phone: formattedPhone,
      order_items: orderItems,
      payment_method: payload.payment_method === "COD" ? "COD" : "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: Number(payload.sub_total || 500),
      length: Number(payload.length || 15),
      breadth: Number(payload.breadth || 15),
      height: Number(payload.height || 10),
      weight: Number(payload.weight || 1.0),
    };

    console.log("Submitting order to Shiprocket:", orderBody.order_id);
    const createOrderRes = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderBody),
    });

    const createOrderData = await createOrderRes.json();
    console.log("Shiprocket Order Creation Response:", createOrderData);

    if (!createOrderRes.ok || (!createOrderData.order_id && !createOrderData.shipment_id)) {
      const errMsg = createOrderData.message || createOrderData.errors || JSON.stringify(createOrderData);
      return new Response(
        JSON.stringify({ error: `Shiprocket order creation failed: ${errMsg}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const srOrderId = String(createOrderData.order_id);
    const shipmentId = String(createOrderData.shipment_id || srOrderId);
    let awbCode = createOrderData.awb_code || "";
    let courierName = createOrderData.courier_name || "";

    // 4. Request AWB / Assign Courier if not auto-assigned
    if (!awbCode && shipmentId) {
      try {
        console.log(`Requesting AWB assignment for shipment ${shipmentId}...`);
        const awbRes = await fetch(`${SHIPROCKET_API_URL}/courier/assign/awb`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ shipment_id: shipmentId }),
        });

        const awbData = await awbRes.json();
        console.log("AWB Assignment Response:", awbData);

        if (awbData.response?.data?.awb_code) {
          awbCode = awbData.response.data.awb_code;
          courierName = awbData.response.data.courier_name || courierName;
        } else if (awbData.awb_code) {
          awbCode = awbData.awb_code;
          courierName = awbData.courier_name || courierName;
        }
      } catch (awbErr) {
        console.warn("AWB Auto-assignment notice:", awbErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: srOrderId,
        shipment_id: shipmentId,
        awb_code: awbCode || `PENDING-${shipmentId}`,
        courier_name: courierName || "Shiprocket Express",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled error in shiprocket-fulfillment:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error in Shiprocket fulfillment function." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
