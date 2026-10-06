import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Shiprocket sometimes sends GET verification requests
  if (req.method === "GET") {
    return new Response("Shiprocket Webhook Receiver is Active", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload = await req.json();
    console.log("Received Shiprocket Webhook Event:", JSON.stringify(payload));

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase admin environment credentials.");
      return new Response(JSON.stringify({ error: "Missing backend config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract common fields sent by Shiprocket
    const awb = payload.awb || payload.awb_code || payload.awb_number;
    const orderId = payload.order_id || payload.channel_order_id;
    const currentStatus = String(payload.current_status || payload.status || "").toUpperCase();
    const courierName = payload.courier_name;
    const etd = payload.etd || payload.expected_date;

    console.log(`Processing update for AWB: ${awb}, Order: ${orderId}, Status: ${currentStatus}`);

    // Map Shiprocket courier statuses to Camqrew internal order statuses
    let mappedStatus: string | null = null;
    if (currentStatus.includes("DELIVERED")) {
      mappedStatus = "delivered";
    } else if (
      currentStatus.includes("OUT FOR DELIVERY") ||
      currentStatus.includes("REACHED AT DESTINATION")
    ) {
      mappedStatus = "out_for_delivery";
    } else if (
      currentStatus.includes("IN TRANSIT") ||
      currentStatus.includes("PICKED UP") ||
      currentStatus.includes("SHIPPED")
    ) {
      mappedStatus = "shipped";
    } else if (
      currentStatus.includes("CANCEL") ||
      currentStatus.includes("RTO") ||
      currentStatus.includes("LOST")
    ) {
      mappedStatus = "cancelled";
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (mappedStatus) {
      updates.status = mappedStatus;
    }
    if (courierName) {
      updates.courier_name = courierName;
    }
    if (awb) {
      updates.awb_code = awb;
    }
    if (etd) {
      updates.estimated_delivery = etd;
    }

    // Try finding and updating the order by AWB or by Order ID
    let query = supabaseAdmin.from("orders").update(updates);

    if (awb && orderId) {
      query = query.or(`awb_code.eq.${awb},id.eq.${orderId},shiprocket_order_id.eq.${orderId}`);
    } else if (awb) {
      query = query.eq("awb_code", awb);
    } else if (orderId) {
      query = query.or(`id.eq.${orderId},shiprocket_order_id.eq.${orderId}`);
    } else {
      console.warn("Webhook payload lacked both AWB and Order ID.");
      return new Response(JSON.stringify({ warning: "No identifier found in payload" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await query.select();

    if (error) {
      console.error("Supabase update error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Successfully updated order(s) via webhook:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Status synchronized with Camqrew",
        updated_records: data?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Webhook processing error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
