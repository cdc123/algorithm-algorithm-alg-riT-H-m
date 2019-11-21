package com.demo;

public class sparesearray {
    /**
     *
     * 稀疏数组转变
     */
    public static void main(String[] args) {
        int array[][] = new int[11][11];
        array[1][2] = 1;
        array[2][3] = 2;
        int sum = 0;
        for (int i = 0; i < array.length; i++) {
            for (int j = 0; j < array[0].length; j++) {
                if (array[i][j] != 0) {
                    sum++;
                }
                System.out.printf("%d\t",array[i][j]);
            }
            System.out.println();
        }
        System.out.println("-----------------转化----------------------");
        int sarray[][] = new int[sum + 1][3];
        sarray[0][0] = array.length;
        sarray[0][1] = array[0].length;
        sarray[0][2] = sum;
        int a = 1;
        for (int i = 0; i < array.length; i++) {
            for (int j = 0; j < array[0].length; j++) {
                if (array[i][j] != 0) {
                    sarray[a][0] = i;
                    sarray[a][1] = j;
                    sarray[a][2] = array[i][j];
                    a++;
                }
            }
        }
        for (int i = 0; i < sarray.length; i++) {
            for (int j = 0; j < sarray[0].length; j++) {
                System.out.printf("%d\t",sarray[i][j]);
            }
            System.out.println();
        }
        System.out.println("-----------------恢复----------------------");
        int array1[][] = new int[sarray[0][0]][sarray[0][1]];
        for (int i = 1; i < sarray.length; i++) {
                array1[sarray[i][0]][sarray[i][1]] = sarray[i][2];
        }
        for (int i = 0; i < array1.length; i++) {
            for (int j = 0; j < array1[0].length; j++) {
                System.out.printf("%d\t",array1[i][j]);
            }
            System.out.println();
        }
    }
}
