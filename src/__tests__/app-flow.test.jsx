import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App from "../App";
import PaperNote from "../components/PaperNote";

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
    expect(screen.queryByRole("heading", { name: "写下此刻的心情" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "信纸" })).toHaveAttribute("src", "/assets/objects/paper_flat.png");
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

    expect(screen.queryByText("等待折成纸团")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    expect(screen.getByRole("img", { name: "纸团" })).toHaveAttribute("src", "/assets/objects/paper_ball.png");

    expect(screen.queryByRole("button", { name: "投向星空" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("img", { name: "纸团" }));
    expect(screen.getByRole("img", { name: "纸团" })).toHaveClass("throwing-animation");

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
    });

    const savedAfterThrow = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
    expect(savedAfterThrow[0].star).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^star_/),
        x: expect.any(Number),
        y: expect.any(Number)
      })
    );
    const sadTraveler = screen.getByRole("img", { name: "难过状态的小王子" });
    expect(sadTraveler).toHaveAttribute("src", "/assets/character/traveler_sad.png");
    expect(sadTraveler).toHaveClass("character-actor-image");

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

  test("纸条和纸团流程不再显示外层卡片容器", async () => {
    const user = userEvent.setup();
    const record = {
      id: "record_visual",
      text: "111",
      emotion: "calm",
      star: null
    };

    const { container } = render(
      <PaperNote record={record} records={[]} onThrowComplete={vi.fn()} />
    );

    expect(container.querySelector(".paper-note-scene")).toBeInTheDocument();
    expect(container.querySelector(".paper-note")).not.toBeInTheDocument();
    expect(screen.queryByText("等待折成纸团")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "折成纸团" }));

    expect(container.querySelector(".paper-ball-scene")).toBeInTheDocument();
    expect(container.querySelector(".paper-ball")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "投向星空" })).not.toBeInTheDocument();
  });

  test("待折纸条可以取消并撤回未投掷记录", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "先不投了");
    await user.click(screen.getByRole("button", { name: "完成" }));

    expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.queryByRole("button", { name: "折成纸团" })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))).toHaveLength(0);
  });

  test("记录弹窗使用无外框的信纸浮层", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));

    expect(container.querySelector(".paper-writing-modal")).toBeInTheDocument();
    expect(container.querySelector(".paper-writing-scene")).toBeInTheDocument();
    expect(container.querySelector(".diary-modal")).not.toBeInTheDocument();
    expect(screen.queryByText("等待折成纸团")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "关闭" })).not.toBeInTheDocument();
    expect(container.querySelector(".paper-button-row")).toBeInTheDocument();
  });
});
