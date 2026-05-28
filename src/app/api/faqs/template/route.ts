import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const wb = XLSX.utils.book_new();

    const templateData = [
      ["标题*", "内容*", "类型", "操作系统", "可见范围", "分类", "标签(逗号分隔)"],
      [
        "如何执行OTA升级？",
        "## 步骤\n1. 连接网络\n2. 检查更新\n3. 下载安装",
        "设备端",
        "Android",
        "公开",
        "OTA升级",
        "hotspot,wifi",
      ],
      [
        "设备无法连接服务器怎么办？",
        "## 排查步骤\n\n1. 检查网络连接\n2. 检查DNS设置\n3. 重启设备",
        "平台端",
        "不限",
        "公开",
        "设备连接",
        "wifi",
      ],
    ];

    const instructionsData = [
      ["FAQ批量导入模板 - 填写说明"],
      [""],
      ["字段名", "必填", "说明", "可选值"],
      ["标题", "是", "FAQ问题标题", ""],
      ["内容", "是", "FAQ回答内容，支持Markdown格式", ""],
      ["类型", "否", "FAQ类型，默认平台端", "平台端, 设备端, 其他"],
      ["操作系统", "否", "适用的操作系统，默认不限", "Android, RTOS, Linux, 不限"],
      ["可见范围", "否", "可见性，默认公开", "公开, 内部"],
      ["分类", "否", "分类名称", "OTA升级, 设备连接, 网络异常等"],
      ["标签", "否", "多个标签用英文逗号分隔", ""],
      [""],
      ["注意事项"],
      ["1. 带*的字段为必填项"],
      ["2. 内容字段支持Markdown格式"],
      ["3. 标签用英文逗号分隔"],
      ["4. 导入后状态为草稿，需手动发布"],
      ["5. 重复标题的FAQ将自动跳过"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 30 }, { wch: 60 }, { wch: 10 },
      { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 25 },
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 40 }];

    XLSX.utils.book_append_sheet(wb, ws, "FAQ导入数据");
    XLSX.utils.book_append_sheet(wb, wsInstructions, "填写说明");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=FAQ_Import_Template.xlsx",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
