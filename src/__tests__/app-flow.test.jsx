import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import App from "../App";

describe("技术 A 第一阶段数据闭环", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  test("用户记录情绪后生成完整 record，并通过投掷回写 star 后可点击回看", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "今天有点累，但我想把它交给星空");
    await user.click(screen.getByRole("button", { name: "难过" }));
    await user.click(screen.getByRole("button", { name: "完成" }));

    const savedAfterCreate = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
    expect(savedAfterCreate).toHaveLength(1);
    expect(savedAfterCreate[0]).toMatchObject({
      text: "今天有点累，但我想把它交给星空",
      emotion: "sad",
      star: null,
      title: "",
      aiSuggestedEmotion: "",
      favorite: false,
      deleted: false,
      audioUrl: "",
      imageUrl: "",
      diaryBookId: "default",
      gestureCreated: false
    });

    expect(screen.getByText("等待折成纸团")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("button", { name: "投向星空" }));

    const savedAfterThrow = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
    expect(savedAfterThrow[0].star).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^star_/),
        x: expect.any(Number),
        y: expect.any(Number)
      })
    );

    await user.click(screen.getByRole("button", { name: /查看星星/ }));
    const dialog = screen.getByRole("dialog", { name: "星星详情" });
    expect(within(dialog).getByText("今天有点累，但我想把它交给星空")).toBeInTheDocument();
    expect(within(dialog).getByText("难过")).toBeInTheDocument();
  });

  test("刷新后从 localStorage 恢复星星并仍可回看", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_demo",
          text: "这是刷新后还在的星星",
          emotion: "happy",
          createdAt: "2026-04-25 21:00:00",
          star: { id: "star_demo", x: 320, y: 140 },
          title: "",
          aiSuggestedEmotion: "",
          aiFeedback: "这颗星星已经替你收下了今天的心情。",
          favorite: false,
          deleted: false,
          audioUrl: "",
          imageUrl: "",
          diaryBookId: "default",
          gestureCreated: false
        }
      ])
    );

    render(<App />);

    await user.click(screen.getByRole("button", { name: /查看星星/ }));
    expect(screen.getByText("这是刷新后还在的星星")).toBeInTheDocument();
  });
});
