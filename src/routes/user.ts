import * as Koa from 'koa';
import * as Router from 'koa-router';
import { addUser, updateUser, deleteUser } from '../events/users';
import { findUser } from '../state/users';
import { v4 as uuidV4 } from 'uuid';

const postHandler = async (ctx: Koa.Context) => {
  const user = ctx.request.body;

  if (await findUser(user.email)) {
    ctx.status = 422;
    return
  }

  user.id = uuidV4();
  addUser(user)
  ctx.body = await findUser(ctx.params.email)
  ctx.status = 200;
};

const postIdHandler = async (ctx: Koa.Context) => {
  const userChanges = ctx.request.body;
  const user = await findUser(ctx.params.email)
  if (!user) {
    ctx.status = 404;
    return
  }

  await updateUser(user._id, userChanges)
  ctx.body = await findUser(ctx.params.email)
  ctx.status = 200;
};

const deleteIdHandler = async (ctx: Koa.Context) => {
  const user = await findUser(ctx.params.email)
  if (!user) {
    ctx.status = 404;
    return
  }

  deleteUser(user._id)
  ctx.body = user
  ctx.status = 204;
};

const getHandler = async (ctx: Koa.Context) => {
  const user = await findUser(ctx.params.email)
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
  .delete('/:email', deleteIdHandler)
  .get('/:email', getHandler);

export default user;
