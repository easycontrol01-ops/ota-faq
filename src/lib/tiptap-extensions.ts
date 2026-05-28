import { Node, mergeAttributes } from "@tiptap/core";

// Resizable Image Extension for Tiptap
export const ResizableImage = Node.create({
  name: "resizableImage",

  group: "block",
  inline: false,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      width: { default: "400" },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]:not([src^="data:image/"])' }, { tag: 'img[src^="data:image/"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const containerWidth = HTMLAttributes.width || "400";
    const src = HTMLAttributes.src || "";
    const alt = HTMLAttributes.alt || "";
    return [
      "div",
      { class: "image-container", style: `display:inline-block;max-width:100%;position:relative;margin:8px 0;` },
      [
        "img",
        mergeAttributes(HTMLAttributes, {
          src,
          alt,
          width: containerWidth,
          style: `width:${containerWidth}px;max-width:100%;height:auto;display:block;border-radius:6px;cursor:pointer;`,
          class: "editable-image",
        }),
      ],
      ["div", { class: "resize-trigger", style: "position:absolute;right:-3px;bottom:0;top:0;width:10px;cursor:ew-resize;" }],
    ];
  },

  addCommands() {
    return {
      setResizableImage:
        (options: { src: string; alt?: string; width?: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as any;
  },
});

// File Attachment Extension
export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  inline: false,

  addAttributes() {
    return {
      src: { default: "" },
      filename: { default: "" },
      filesize: { default: "" },
      filetype: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-file-attachment]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, filename, filesize, filetype } = HTMLAttributes;
    return [
      "div",
      {
        "data-file-attachment": "",
        style: "display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f5f7fa;border:1px solid #e2e8f0;border-radius:8px;margin:4px 0;max-width:480px;",
      },
      [ "div", { style: "font-size:24px;flex-shrink:0;" }, "📎" ],
      [
        "div",
        { style: "min-width:0;flex:1;" },
        [ "div", { style: "font-size:13px;font-weight:500;color:#1a202c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" }, filename || "" ],
        [
          "div",
          { style: "font-size:11px;color:#a0aec0;margin-top:2px;" },
          (filetype || "") + " · " + (filesize || "") + " · ",
          [ "a", { href: src, download: filename, style: "color:#444CE7;text-decoration:underline;" }, "下载" ],
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setFileAttachment:
        (options: { src: string; filename: string; filesize: string; filetype: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({ type: this.name, attrs: options });
        },
    } as any;
  },
});
