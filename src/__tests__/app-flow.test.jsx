import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App from "../App";
import PaperNote from "../components/PaperNote";

vi.setConfig({ testTimeout: 20000 });

describe("指尖星空演示闭环", () => {
  function mockCameraStream() {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop }]
    };
    const getUserMedia = vi.fn().mockResolvedValue(stream);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia }
    });

    return { getUserMedia, stop, stream };
  }

  function todayAt(time) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day} ${time}`;
  }

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
    expect(sadTraveler).toHaveAttribute("src", expect.stringContaining("/assets/character/traveler_sad_v2.png"));
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
    function ControlledPaperNote() {
      const [isFolded, setIsFolded] = React.useState(false);

      return (
        <PaperNote
          record={record}
          isFolded={isFolded}
          isThrowing={false}
          onFold={() => setIsFolded(true)}
          onThrow={vi.fn()}
        />
      );
    }

    const { container } = render(<ControlledPaperNote />);

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
  }, 10000);

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
          createdAt: todayAt("12:00:00"),
          star: { id: "star_happy_today", x: 120, y: 120 }
        },
        {
          id: "record_sad_today",
          text: "今天很难过",
          emotion: "verySad",
          createdAt: todayAt("12:01:00"),
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
    expect(within(panel).getByRole("button", { name: "雨夜星空" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "炉边星空" })).toBeInTheDocument();
    expect(within(panel).getAllByRole("img", { name: /平静.*星空场景/ })).toHaveLength(4);
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

  test("投掷后出现焦虑泡泡恢复物件，点击后场景回到平静", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "脑子里有很多绕来绕去的声音。");
    await user.click(screen.getByRole("button", { name: "焦虑" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      expect(container.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
      expect(container.querySelectorAll(".recovery-object")).toHaveLength(6);
    });

    for (const button of Array.from(container.querySelectorAll(".recovery-object")).slice(0, 5)) {
      await user.click(button);
    }

    await waitFor(
      () => {
        expect(container.querySelector(".recovery-interaction-layer")).not.toBeInTheDocument();
        expect(screen.getByRole("img", { name: "平静状态的小王子" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "平静状态的狐狸" })).toHaveAttribute(
          "src",
          expect.stringContaining("/assets/companions/fox/fox_sleep.png")
        );
        expect(screen.getByRole("img", { name: "平静状态的玫瑰" })).toHaveAttribute(
          "src",
          expect.stringContaining("/assets/companions/rose/rose_soft.png")
        );
      },
      { timeout: 2200 }
    );
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
    expect(within(panel).getByText("摄像头未开启")).toBeInTheDocument();
    expect(panel.closest(".modal-backdrop")).not.toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));
    expect(await within(panel).findByText(/摄像头权限不可用/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "记录情绪" })).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "关闭手势实验" }));
    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    expect(screen.getByLabelText("想交给星空的话")).toBeInTheDocument();
  });

  test("打开手势实验小窗后主流程按钮仍然可点击", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "手势实验" }));

    const panel = screen.getByRole("dialog", { name: "手势实验" });
    expect(panel).toHaveClass("gesture-monitor-panel");
    expect(panel.closest(".modal-backdrop")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "记录情绪" }));

    expect(screen.getByLabelText("想交给星空的话")).toBeInTheDocument();
  });

  test("模拟 OK/捏合可以打开并提交记录弹窗", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });

    expect(within(panel).getByText("OK/捏合：打开记录弹窗")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "OK/捏合" }));
    expect(screen.getByLabelText("想交给星空的话")).toBeInTheDocument();
    expect(within(panel).getByText("OK/捏合：完成这张纸条")).toBeInTheDocument();

    await user.type(screen.getByLabelText("想交给星空的话"), "不点完成，直接用捏合提交");
    await user.click(within(panel).getByRole("button", { name: "OK/捏合" }));

    expect(screen.queryByRole("dialog", { name: "记录情绪" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "折成纸团" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))[0].text).toBe(
      "不点完成，直接用捏合提交"
    );
    expect(within(panel).getByText("五指合拢：把信纸捏成纸团")).toBeInTheDocument();
  });

  test("摄像头授权成功后手势面板显示实时预览区域", async () => {
    const user = userEvent.setup();
    const { getUserMedia, stream, stop } = mockCameraStream();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });

    expect(within(panel).getByText("摄像头未开启")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));

    const video = await within(panel).findByLabelText("摄像头实时预览");
    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(video.srcObject).toBe(stream);
    expect(stop).not.toHaveBeenCalled();
  });

  test("开启摄像头后仍然能点击记录情绪", async () => {
    const user = userEvent.setup();
    mockCameraStream();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));
    await within(panel).findByLabelText("摄像头实时预览");

    await user.click(screen.getByRole("button", { name: "记录情绪" }));

    expect(screen.getByLabelText("想交给星空的话")).toBeInTheDocument();
  });

  test("关闭手势面板时会停止摄像头轨道", async () => {
    const user = userEvent.setup();
    const { stop } = mockCameraStream();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));
    await within(panel).findByLabelText("摄像头实时预览");

    await user.click(within(panel).getByRole("button", { name: "关闭手势实验" }));

    expect(stop).toHaveBeenCalledTimes(1);
  });

  test("模拟五指合拢会真的把待投掷纸条折成纸团", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "用模拟按钮折一下");
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "手势实验" }));

    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(within(panel).getByRole("button", { name: "五指合拢" }));

    expect(screen.getByRole("img", { name: "纸团" })).toBeInTheDocument();
  });

  test("模拟 OK/捏合会触发当前纸团阶段动作", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "用捏合投出去");
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("button", { name: "手势实验" }));

    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(within(panel).getByRole("button", { name: "OK/捏合" }));

    expect(screen.getByRole("img", { name: "纸团" })).toHaveClass("throwing-animation");
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
    });
  });

  test("恢复阶段模拟 OK/捏合会安放当前星星并回到平静", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "投出去以后用手势恢复");
    await user.click(screen.getByRole("button", { name: "焦虑" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      expect(document.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
      expect(within(panel).getByText("OK/捏合：安放当前星星")).toBeInTheDocument();
    });

    await user.click(within(panel).getByRole("button", { name: "OK/捏合" }));

    await waitFor(() => {
      expect(document.querySelector(".recovery-interaction-layer")).not.toBeInTheDocument();
      expect(screen.getByRole("img", { name: "平静状态的小王子" })).toBeInTheDocument();
    });
  });

  test("投掷后出现专属恢复物件，点击足够数量后安放星星并回到平静", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByRole("textbox"), "some wronged feeling to be held by the sky");
    await user.click(screen.getByRole("button", { name: "委屈" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))).toHaveLength(1);
    });
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
    });

    await waitFor(() => {
      expect(container.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
      expect(container.querySelectorAll(".recovery-object")).toHaveLength(7);
    });

    const activeObjects = () => Array.from(container.querySelectorAll(".recovery-object:not(.is-resolved)"));
    for (const button of activeObjects().slice(0, 5)) {
      await user.click(button);
    }

    await waitFor(() => {
      expect(screen.getByText("这颗星星已经被你安放好了。")).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(container.querySelector(".recovery-interaction-layer")).not.toBeInTheDocument();
        expect(container.querySelector('img[src*="traveler_calm.png"]')).toBeInTheDocument();
      },
      { timeout: 2200 }
    );
  });

  test("环境面板展示当前情绪的四个星空场景变体，选择场景不会自动播放白噪音", async () => {
    const user = userEvent.setup();
    const stopSpy = vi.fn();
    class MockAudioNode {
      connect() {
        return this;
      }
      disconnect() {}
      start = vi.fn();
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

    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_env_wronged",
          text: "想换一个能接住委屈的星空",
          emotion: "wronged",
          createdAt: "2026-05-11 20:00:00",
          star: { id: "star_env_wronged", x: 220, y: 150 },
          favorite: false,
          deleted: false
        }
      ])
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "改变环境" }));

    const panel = screen.getByRole("dialog", { name: "环境面板" });
    expect(within(panel).getByRole("button", { name: "雨夜星空" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "炉边星空" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "海浪星空" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "摇篮星空" })).toBeInTheDocument();
    expect(within(panel).getAllByRole("img", { name: /委屈.*星空场景/ })).toHaveLength(4);

    await user.click(within(panel).getByRole("button", { name: "炉边星空" }));

    expect(within(panel).getByRole("button", { name: "播放白噪音" })).toBeInTheDocument();
    expect(within(panel).queryByText("播放中")).not.toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "篝火" })).toHaveClass("is-selected");
    expect(stopSpy).not.toHaveBeenCalled();
  });

  test("同一种情绪的星星按星座模板落点，并在三颗后显示主星空星座提示", async () => {
    const user = userEvent.setup();
    const randomValues = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => randomValues.shift() ?? 0.5);

    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_wronged_1",
          text: "第一颗委屈星",
          emotion: "wronged",
          createdAt: "2026-05-11 20:00:00",
          star: { id: "star_wronged_1", x: 228, y: 148 },
          favorite: false,
          deleted: false
        },
        {
          id: "record_wronged_2",
          text: "第二颗委屈星",
          emotion: "wronged",
          createdAt: "2026-05-11 20:01:00",
          star: { id: "star_wronged_2", x: 332, y: 116 },
          favorite: false,
          deleted: false
        }
      ])
    );

    try {
      render(<App />);

      await user.click(screen.getByRole("button", { name: "记录情绪" }));
      await user.type(screen.getByRole("textbox"), "第三颗委屈星也想被放好");
      await user.click(screen.getByRole("button", { name: "委屈" }));
      await user.click(screen.getByRole("button", { name: "完成" }));
      await user.click(screen.getByRole("button", { name: "折成纸团" }));
      await user.click(screen.getByRole("img", { name: "纸团" }));

      await waitFor(() => {
        const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
        const newStar = saved.find((record) => record.text === "第三颗委屈星也想被放好").star;
        expect(newStar.x).toBeGreaterThanOrEqual(440);
        expect(newStar.x).toBeLessThanOrEqual(490);
        expect(newStar.y).toBeGreaterThanOrEqual(160);
        expect(newStar.y).toBeLessThanOrEqual(240);
      });

      expect(screen.getByText("它们正在慢慢连成一条温柔的路。")).toBeInTheDocument();
      expect(document.querySelector(".main-constellation-hint")).toBeInTheDocument();
    } finally {
      randomSpy.mockRestore();
    }
  });

  test("恢复物件未点够前只显示进度，不提前显示安放完成文案", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByRole("textbox"), "这次想慢慢点亮雨滴");
    await user.click(screen.getByRole("button", { name: "委屈" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      expect(container.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
      expect(screen.getByText("轻轻点亮雨滴 0/5")).toBeInTheDocument();
    });
    expect(screen.queryByText("这颗星星已经被你安放好了。")).not.toBeInTheDocument();

    const firstTwo = Array.from(container.querySelectorAll(".recovery-object")).slice(0, 2);
    for (const button of firstTwo) {
      await user.click(button);
    }

    expect(screen.getByText("轻轻点亮雨滴 2/5")).toBeInTheDocument();
    expect(screen.queryByText("这颗星星已经被你安放好了。")).not.toBeInTheDocument();
  });
});
