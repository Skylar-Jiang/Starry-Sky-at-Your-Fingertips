import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    await user.click(screen.getByRole("button", { name: "非常难过" }));
    await user.click(screen.getByRole("button", { name: "完成" }));

    const savedAfterCreate = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
    expect(savedAfterCreate).toHaveLength(1);
    expect(savedAfterCreate[0]).toMatchObject({
      text: "今天有点累，但我想把它交给星空",
      emotion: "verySad",
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
    const sadTraveler = screen.getByRole("img", { name: "非常难过状态的小王子" });
    expect(sadTraveler).toHaveAttribute("src", expect.stringContaining("/assets/character/traveler_sad.png"));
    expect(sadTraveler).toHaveClass("character-actor-image");

    await user.click(screen.getByRole("button", { name: /查看星星/ }));
    const dialog = screen.getByRole("dialog", { name: "星星详情" });
    expect(within(dialog).getByText("今天有点累，但我想把它交给星空")).toBeInTheDocument();
    expect(within(dialog).getByText("非常难过")).toBeInTheDocument();
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

  test("用户可以选择六类情绪，投掷后回看显示正确情绪标签", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));

    for (const label of ["开心", "平静", "委屈", "生气", "非常难过", "焦虑"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }

    await user.type(screen.getByLabelText("想交给星空的话"), "今天心里有一点闷。");
    await user.click(screen.getByRole("button", { name: "非常难过" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
      expect(saved[0].emotion).toBe("verySad");
    });

    await user.click(screen.getByRole("button", { name: /查看星星/ }));
    const dialog = screen.getByRole("dialog", { name: "星星详情" });
    expect(within(dialog).getByText("非常难过")).toBeInTheDocument();
    expect(within(dialog).getByText(/场景正在慢慢恢复平静/)).toBeInTheDocument();
  });

  test("投掷后主场景显示当前情绪对应的狐狸和玫瑰素材", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "有一点委屈，但想被好好接住。");
    await user.click(screen.getByRole("button", { name: "委屈" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
      expect(saved[0].emotion).toBe("wronged");
      expect(screen.getByRole("img", { name: "委屈状态的狐狸" })).toHaveAttribute(
        "src",
        expect.stringContaining("/assets/companions/fox/fox_comfort.png")
      );
    });

    expect(screen.getByRole("img", { name: "委屈状态的玫瑰" })).toHaveAttribute(
      "src",
      expect.stringContaining("/assets/companions/rose/rose_wilt.png")
    );
  });

  test("观测星空会为难过类星星显示泪湖座，并保持星星回看", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_1",
          text: "第一颗委屈星星",
          emotion: "wronged",
          createdAt: "2026-04-29 12:00:00",
          star: { id: "star_1", x: 120, y: 120 }
        },
        {
          id: "record_2",
          text: "第二颗委屈星星",
          emotion: "wronged",
          createdAt: "2026-04-29 12:01:00",
          star: { id: "star_2", x: 220, y: 150 }
        },
        {
          id: "record_3",
          text: "第三颗委屈星星",
          emotion: "verySad",
          createdAt: "2026-04-29 12:02:00",
          star: { id: "star_3", x: 320, y: 110 }
        }
      ])
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "观测星空" }));

    expect(screen.getByRole("region", { name: "观测星空" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "泪湖座" })).toHaveAttribute(
      "src",
      "/assets/constellations/constellation_tear_lake.png"
    );

    await user.click(screen.getAllByRole("button", { name: /查看星星/ })[0]);
    expect(screen.getByRole("dialog", { name: "星星详情" })).toBeInTheDocument();
  });

  test("观测星空支持情绪筛选、日期筛选和统计", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_happy_today",
          text: "今天很亮",
          emotion: "happy",
          createdAt: "2026-05-05 12:00:00",
          star: { id: "star_happy_today", x: 120, y: 120 }
        },
        {
          id: "record_sad_today",
          text: "今天很难过",
          emotion: "verySad",
          createdAt: "2026-05-05 12:01:00",
          star: { id: "star_sad_today", x: 220, y: 150 }
        },
        {
          id: "record_sad_old",
          text: "很久以前的难过",
          emotion: "verySad",
          createdAt: "2026-04-20 12:01:00",
          star: { id: "star_sad_old", x: 320, y: 170 }
        }
      ])
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "观测星空" }));

    const panel = screen.getByRole("region", { name: "观测控制" });
    expect(within(panel).getByText("总星星 3")).toBeInTheDocument();
    expect(within(panel).getByText("当前筛选 3")).toBeInTheDocument();

    await user.selectOptions(within(panel).getByLabelText("情绪筛选"), "verySad");
    expect(within(panel).getByText("当前筛选 2")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /查看星星：非常难过/ })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /查看星星：开心/ })).not.toBeInTheDocument();

    await user.selectOptions(within(panel).getByLabelText("日期筛选"), "today");
    expect(within(panel).getByText("当前筛选 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /查看星星：非常难过/ }));
    expect(screen.getByRole("dialog", { name: "星星详情" })).toBeInTheDocument();
  });

  test("改变环境按钮打开可关闭的环境面板", async () => {
    const user = userEvent.setup();
    const stopSpy = vi.fn();
    class MockAudioNode {
      connect() {
        return this;
      }
      disconnect() {}
      start() {}
      stop = stopSpy;
    }
    class MockAudioContext {
      currentTime = 0;
      destination = new MockAudioNode();
      createGain() {
        return { gain: { value: 0.2, setTargetAtTime: vi.fn() }, connect: vi.fn() };
      }
      createBuffer() {
        return { getChannelData: () => new Float32Array(128) };
      }
      createBufferSource() {
        return new MockAudioNode();
      }
      createBiquadFilter() {
        return new MockAudioNode();
      }
      createOscillator() {
        const node = new MockAudioNode();
        node.frequency = { value: 0 };
        return node;
      }
      resume() {
        return Promise.resolve();
      }
      close() {
        return Promise.resolve();
      }
    }
    window.AudioContext = MockAudioContext;
    window.webkitAudioContext = MockAudioContext;

    render(<App />);

    await user.click(screen.getByRole("button", { name: "改变环境" }));

    const panel = screen.getByRole("dialog", { name: "环境面板" });
    expect(within(panel).getByRole("img", { name: "狐狸样式预览" })).toBeInTheDocument();
    expect(within(panel).getByRole("img", { name: "玫瑰状态预览" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "雨声" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "篝火" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "海浪" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "摇篮曲" })).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "雨声" }));
    await user.click(within(panel).getByRole("button", { name: "播放白噪音" }));
    expect(within(panel).getByText("播放中")).toBeInTheDocument();

    fireEvent.change(within(panel).getByLabelText("环境音量"), { target: { value: "42" } });
    expect(within(panel).getByText("42%")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "关闭环境面板" }));
    expect(screen.queryByRole("dialog", { name: "环境面板" })).not.toBeInTheDocument();
    expect(stopSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "改变环境" }));
    expect(within(screen.getByRole("dialog", { name: "环境面板" })).getByText("播放中")).toBeInTheDocument();
  });

  test("投掷焦虑情绪后出现可点击恢复泡泡，清空后显示恢复状态", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "脑子里有很多绕来绕去的声音。");
    await user.click(screen.getByRole("button", { name: "焦虑" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /点击沙尘泡泡/ })).toHaveLength(6);
    });

    await user.click(screen.getAllByRole("button", { name: /点击沙尘泡泡/ })[0]);
    expect(screen.getAllByRole("button", { name: /点击沙尘泡泡/ })).toHaveLength(5);

    for (const button of screen.getAllByRole("button", { name: /点击沙尘泡泡/ })) {
      await user.click(button);
    }

    expect(screen.getByText("场景恢复平静")).toBeInTheDocument();
  });

  test("星星详情支持收藏和软删除并写入 localStorage", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_manage",
          text: "想留住也可以放下的一颗星",
          emotion: "calm",
          createdAt: "2026-05-05 20:00:00",
          star: { id: "star_manage", x: 210, y: 150 },
          favorite: false,
          deleted: false
        }
      ])
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: /查看星星：平静/ }));

    const dialog = screen.getByRole("dialog", { name: "星星详情" });
    expect(within(dialog).getByText("静环座")).toBeInTheDocument();
    expect(within(dialog).getByText("2026-05-05")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "收藏星星" }));
    expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))[0].favorite).toBe(true);
    expect(within(dialog).getByRole("button", { name: "取消收藏" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "删除星星" }));
    const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
    expect(saved[0].deleted).toBe(true);
    expect(screen.queryByRole("button", { name: /查看星星：平静/ })).not.toBeInTheDocument();
  });

  test("手势实验入口默认不影响主流程，权限失败时提供键鼠兜底", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("denied"))
      }
    });

    render(<App />);
    expect(screen.getByRole("button", { name: "记录情绪" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });
    expect(within(panel).getByText("实验功能，失败时请使用鼠标。")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));
    expect(await within(panel).findByText("摄像头权限不可用，请继续使用鼠标。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "记录情绪" })).toBeInTheDocument();
  });
});
