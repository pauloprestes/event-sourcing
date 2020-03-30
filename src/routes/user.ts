import * as Koa from 'koa';
import * as Router from 'koa-router';
import { addUser, updateUser } from '../events/users';
import { findUser } from '../store/users';

const postHandler = async (ctx: Koa.Context) => {
  const user = ctx.request.body;
  addUser(user)
  ctx.body = user
  ctx.status = 200;
};

const postIdHandler = async (ctx: Koa.Context) => {
  const userChanges = ctx.request.body;
  const user = findUser(ctx.params.email)
  if (!user) {
    ctx.status = 404;
    return
  }

  updateUser({ ...userChanges, id: user.id })
  ctx.body = user
  ctx.status = 200;
};

const getHandler = async (ctx: Koa.Context) => {
  const user = findUser(ctx.params.email)
  if (!user) {
    ctx.status = 404;
    return
  }
  ctx.body = user
  ctx.status = 200;
};

const user = new Router()
  .post('/', postHandler)
  .post('/:email', postIdHandler)
  .get('/:email', getHandler);

export default user;
