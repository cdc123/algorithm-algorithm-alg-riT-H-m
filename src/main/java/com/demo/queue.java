package com.demo;

public class queue {
    /**
     * 环形队列实现
     * 思路：预留一个空位
     */
    public static void main(String[] args) {
        Circle que = new Circle(4);
        que.add(3);
        que.add(5);
        que.add(7);
        que.add(9);
        que.showQueue();
        System.out.println();
        System.out.println("取出" + que.get());
        System.out.println("取出" + que.get());
        que.showQueue();
        que.add(13);
        System.out.println();
        que.showQueue();
    }
}

class Circle {
    private int maxSize;//最大容量   保留一个空位
    private int front; //队列第一个元素 初始0
    private int rear; //最后一个元素的后一个位置 初始0
    private int[] arr; //表示数组

    public Circle(int maxSize) {
        arr = new int[maxSize + 1];
        this.maxSize = maxSize + 1;
    }

    //判断队列是否满（排除空位首尾相连）
    public boolean isFull() {
        return (rear + 1) % maxSize == front;
    }

    //判断是否为空（首位是空位,空尾相连）
    public boolean isEmpty() {
        return front == rear;
    }

    //向队列添加数据
    public void add(int num) {
        if (isFull()) {
            System.out.println("队列已满，无法添加数据");
            return;
        }
        arr[rear] = num;
        rear = (rear + 1) % maxSize;
    }

    //取数据
    public int get() {
        if (isEmpty()) {
            RuntimeException exception = new RuntimeException("队列为空，不能取出数据");
            throw exception;
        }
        int getNum = arr[front];
        arr[front] = 0;
        front = (front + 1) % maxSize;
        return getNum;
    }

    //查看队列
    public void showQueue() {
        if (isEmpty()) {
            System.out.println("队列为空");
            return;
        }
        int first = front;
        int last = rear - 1;
        while (true){
            System.out.printf("%d\t", arr[first]);
            first = (first + 1) % maxSize;
            if(first == last + 1){
                break;
            }
        }
    }
}
