import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import * as path from 'path';
import { User, UserResponse } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly usersFilePath: string;

  constructor(private jwtService: JwtService) {
    this.usersFilePath = path.join(
      process.cwd(),
      '../../data/users/users.json',
    );
  }

  async onModuleInit() {
    // 初始化用户文件，创建默认管理员账号
    await this.initializeUsers();
  }

  private async initializeUsers() {
    try {
      await fs.access(this.usersFilePath);
    } catch {
      // 文件不存在，创建默认用户
      const defaultUser: User = {
        id: '1',
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        createdAt: new Date().toISOString(),
      };

      await fs.mkdir(path.dirname(this.usersFilePath), { recursive: true });
      await fs.writeFile(
        this.usersFilePath,
        JSON.stringify([defaultUser], null, 2),
      );
    }
  }

  private async readUsers(): Promise<User[]> {
    try {
      const data = await fs.readFile(this.usersFilePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const users = await this.readUsers();
    const user = users.find((u) => u.username === username);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: this.sanitizeUser(user),
    };
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const users = await this.readUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: User): UserResponse {
    const { password, ...result } = user;
    console.log('Sanitized user:', result, password); // 调试输出
    return result as UserResponse;
  }
}
